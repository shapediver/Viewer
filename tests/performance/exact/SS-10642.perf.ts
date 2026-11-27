import {expect, type Page} from "@playwright/test";
import {installPickClock, installPickWork} from "../fixtures/counters/picking";
import {ASSET_HOST, open, test} from "./harness";

/**
 * SS-10642: the pick bounds hierarchy compares its objects with the scene
 * only after the scene changed. On a static scene with a still camera a pick
 * compares nothing (`objectsValidated` and `instancesChecked` are 0, however
 * many objects there are); after an update of a node, a hide, a move, an
 * added or removed node or a hover highlight, the next pick finds the new
 * state; and a scene that is dynamic (continuous rendering) is compared on
 * every query as before.
 *
 * Counters per pick (`window.__pickWork`, from `fixtures/counters/picking.ts`):
 * - `objectsValidated`: objects compared with the scene,
 * - `instancesChecked`: instance slots read again.
 * Each scene runs with GPU instancing off (plain meshes: every object is
 * compared without the clock) and on (one instanced mesh).
 */

/** A glb with one box mesh and `count` nodes that place it on a grid. */
function instancesGlb(count: number): Buffer {
	const positions = new Float32Array(24);
	for (let i = 0; i < 8; i++) {
		positions[i * 3] = i & 1 ? 0.4 : -0.4;
		positions[i * 3 + 1] = i & 2 ? 0.4 : -0.4;
		positions[i * 3 + 2] = i & 4 ? 0.8 : 0;
	}
	const indices = new Uint16Array([
		0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6, 7,
		0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
	]);
	const bin = Buffer.concat([
		Buffer.from(positions.buffer),
		Buffer.from(indices.buffer),
	]);
	const columns = Math.ceil(Math.sqrt(count));
	const nodes: object[] = [{name: "instances", children: [] as number[]}];
	for (let i = 0; i < count; i++) {
		(nodes[0] as {children: number[]}).children.push(nodes.length);
		nodes.push({
			name: `i${i}`,
			mesh: 0,
			translation: [(i % columns) * 2, Math.floor(i / columns) * 2, 0],
		});
	}
	const json = {
		asset: {version: "2.0"},
		scene: 0,
		scenes: [{nodes: [0]}],
		nodes,
		meshes: [
			{primitives: [{attributes: {POSITION: 0}, indices: 1, mode: 4}]},
		],
		accessors: [
			{
				bufferView: 0,
				componentType: 5126,
				count: 8,
				type: "VEC3",
				min: [-0.4, -0.4, 0],
				max: [0.4, 0.4, 0.8],
			},
			{bufferView: 1, componentType: 5123, count: 36, type: "SCALAR"},
		],
		bufferViews: [
			{buffer: 0, byteOffset: 0, byteLength: 96},
			{buffer: 0, byteOffset: 96, byteLength: 72},
		],
		buffers: [{byteLength: bin.length}],
	};
	let text = JSON.stringify(json);
	while (text.length % 4) text += " ";
	const jsonChunk = Buffer.from(text, "utf8");
	const binChunk = Buffer.concat([
		bin,
		Buffer.alloc((4 - (bin.length % 4)) % 4),
	]);
	const header = Buffer.alloc(12);
	header.writeUInt32LE(0x46546c67, 0);
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
	const chunk = (type: number, data: Buffer) => {
		const head = Buffer.alloc(8);
		head.writeUInt32LE(data.length, 0);
		head.writeUInt32LE(type, 4);
		return Buffer.concat([head, data]);
	};
	return Buffer.concat([
		header,
		chunk(0x4e4f534a, jsonChunk),
		chunk(0x004e4942, binChunk),
	]);
}

type Compared = {
	objectsValidated: number;
	instancesChecked: number;
	/** Queries that skipped the validation, and all queries. */
	skipped: number;
	queries: number;
};
type Step = {top: string[]; first: Compared; second: Compared};
type Result = {
	instancedMeshes: number;
	/** The first query after the picks of the setup, and a second one. */
	static: Step;
	moved: Step;
	hidden: Step;
	removed: Step;
	added: Step;
	hover: Step;
	/** One query with the scene dynamic (continuous rendering). */
	dynamic: Compared;
	afterDynamic: Step;
};

const COUNT = 400;
/** Instances whose box the pick rays go through (by grid index). */
const PICKED = [0, 7, 123, 399];

async function measure(
	page: Page,
	count: number,
	instancing: boolean,
): Promise<Result> {
	const name = `ss10642-${count}.glb`;
	const glb = instancesGlb(count);
	await page.route(`${ASSET_HOST}/${name}`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	await open(page);
	await page.evaluate(installPickWork);
	await page.evaluate(installPickClock);
	return page.evaluate(
		async ({href, picked, instancing}) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			const work = (window as any).__pickWork;
			const {InteractionEngine, HoverManager, InteractionData} = (
				window as any
			).SDVInteractions;
			await perf.create({shadows: false});
			const root = await SDV.DataEngine.instance.loadContent({
				format: "glb",
				href,
			});
			const byName = new Map<string, any>();
			root.traverse((node: any) => {
				if (/^i\d+$/.test(node.name)) {
					byName.set(node.name, node);
					node.addData(new InteractionData({hover: true}));
				}
			});
			SDV.sceneTree.addNode(root);
			SDV.sceneTree.root.updateVersion();
			perf.viewport.gpuInstancing.enabled = instancing;
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.viewport.camera.zoomTo(undefined, {duration: 0});
			await perf.nextFrame();

			const viewportId = perf.viewport.id;
			const meshes = new Set<any>();
			for (const node of byName.values())
				for (const data of node.data) {
					const converted = data.convertedObject?.[viewportId];
					if (converted?.isInstancedMesh) meshes.add(converted);
				}
			if (meshes.size > 0) work.attach([...meshes][0]);

			// A point in the space of the node of an instance (the glTF is
			// Y-up, the viewer Z-up).
			const point = (index: number, local: number[]) => {
				const object = byName.get(`i${index}`).convertedObject[
					viewportId
				];
				object.updateWorldMatrix(true, false);
				const e = object.matrixWorld.elements;
				return [0, 1, 2].map(
					(r) =>
						e[12 + r] +
						local[0] * e[r] +
						local[1] * e[4 + r] +
						local[2] * e[8 + r],
				);
			};
			const down = (index: number, x: number, y: number) => {
				const top = point(index, [x, y, 10]);
				const bottom = point(index, [x, y, 0]);
				return {
					origin: top,
					direction: [0, 1, 2].map((r) => (bottom[r] - top[r]) / 10),
				};
			};
			// Through the middle of each picked instance, through the gap
			// next to the second, and outside the grid.
			const rays = [
				...picked.map((index: number) => down(index, 0.1, 0.2)),
				down(picked[1], 1.1, 0.2),
				down(0, -5, -5),
			];
			const pick = (ray: any) =>
				perf.viewport.raytraceScene(ray.origin, ray.direction)[0]?.node
					.name ?? "-";
			const pickAll = () => rays.map(pick);
			const clock = (window as any).__pickClock;
			const compared = () => {
				const read = work.read();
				const skipped = clock.read();
				return {
					objectsValidated: read.objectsValidated,
					instancesChecked: read.instancesChecked,
					skipped: skipped.validationsSkipped,
					queries: skipped.queries,
				};
			};
			/** The picks of the scene after a change: the first query after
			 * it, then a second one. */
			const step = (): Step => {
				work.reset();
				clock.reset();
				const top = pickAll();
				const first = compared();
				work.reset();
				clock.reset();
				pickAll();
				return {top, first, second: compared()};
			};
			const apply = async (change: () => void) => {
				change();
				perf.viewport.render();
				await perf.nextFrame();
			};

			// warm-up: builds the hierarchy
			pickAll();
			await perf.nextFrame();
			pickAll();

			const results: any = {instancedMeshes: meshes.size};
			results.static = step();

			// A node moved by 1 along its x axis, into the gap next to it.
			const shifted = byName.get(`i${picked[1]}`);
			await apply(() => {
				shifted.addTransformation({
					id: "shift",
					matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
				});
				shifted.updateVersion(false, false);
				perf.viewport.updateNodeTransformation(shifted);
			});
			results.moved = step();

			// A hidden node is not hit any more.
			const hidden = byName.get(`i${picked[0]}`);
			await apply(() => {
				hidden.visible = false;
				hidden.updateVersion(false, false);
				perf.viewport.updateNode(hidden);
			});
			results.hidden = step();

			// A removed node is not hit any more.
			const removed = byName.get(`i${picked[2]}`);
			const parent = removed.parent;
			await apply(() => {
				parent.removeChild(removed);
				parent.updateVersion();
				SDV.sceneTree.root.updateVersion();
				perf.viewport.update();
			});
			results.removed = step();

			// The same node added again is hit again.
			await apply(() => {
				parent.addChild(removed);
				parent.updateVersion();
				SDV.sceneTree.root.updateVersion();
				perf.viewport.update();
			});
			results.added = step();

			// A hover highlight moves an instance to an effect mesh and back.
			const engine = new InteractionEngine(perf.viewport);
			const hover = new HoverManager();
			hover.effectMaterial = new SDV.MaterialStandardData({
				color: "#dddddd",
			});
			engine.addInteractionManager(hover);
			const move = (p: number[]) =>
				engine.onPointerMove(
					new PointerEvent("pointermove", {
						clientX: p[0],
						clientY: p[1],
						pointerId: 1,
						buttons: 0,
					}),
				);
			const screen = (index: number) =>
				perf.viewport.convert3Dto2D(point(index, [0, 0, 0.4])).client;
			const target = screen(picked[3]);
			move(target);
			await perf.nextFrame();
			results.hover = step();
			move([1, 1]);
			await perf.nextFrame();

			// A dynamic scene is compared on every query.
			const token = perf.viewport.addFlag(
				SDV.FLAG_TYPE.CONTINUOUS_RENDERING,
			);
			await perf.nextFrame();
			await perf.nextFrame();
			pickAll();
			work.reset();
			clock.reset();
			pickAll();
			results.dynamic = compared();
			perf.viewport.removeFlag(token);
			await perf.nextFrame();
			await perf.nextFrame();
			pickAll();
			results.afterDynamic = step();
			return results;
		},
		{href: `${ASSET_HOST}/${name}`, picked: PICKED, instancing},
	);
}

/** Nothing compared: every query skipped its validation. */
function nothingCompared(step: Compared) {
	return {
		objectsValidated: step.objectsValidated,
		instancesChecked: step.instancesChecked,
		allSkipped: step.queries > 0 && step.skipped === step.queries,
	};
}
const EMPTY = {objectsValidated: 0, instancesChecked: 0, allSkipped: true};

for (const instancing of [false, true]) {
	test(`SS-10642 a pick compares nothing on a static scene and finds every change (GPU instancing ${instancing ? "on" : "off"})`, async ({
		page,
	}) => {
		const r = await measure(page, COUNT, instancing);
		const context = JSON.stringify(r);
		const [a, b, c, d] = PICKED.map((i) => `i${i}`);

		expect(r.instancedMeshes > 0, context).toBe(instancing);

		// The picks find the instance under each ray, nothing in the gaps.
		expect(r.static.top, context).toEqual([a, b, c, d, "-", "-"]);
		// The scene did not change: nothing is compared, however many
		// objects there are.
		expect(nothingCompared(r.static.first), context).toEqual(EMPTY);
		expect(nothingCompared(r.static.second), context).toEqual(EMPTY);

		// A moved node is hit at its new place and not at the old one. The
		// first query after the change sees it, the second compares nothing.
		expect(r.moved.top, context).toEqual([a, "-", c, d, b, "-"]);
		expect(nothingCompared(r.moved.second), context).toEqual(EMPTY);

		// A hidden node is not hit.
		expect(r.hidden.top, context).toEqual(["-", "-", c, d, b, "-"]);
		expect(nothingCompared(r.hidden.second), context).toEqual(EMPTY);

		// A removed node is not hit, and hit again once added.
		expect(r.removed.top, context).toEqual(["-", "-", "-", d, b, "-"]);
		expect(nothingCompared(r.removed.second), context).toEqual(EMPTY);
		expect(r.added.top, context).toEqual(["-", "-", c, d, b, "-"]);
		expect(nothingCompared(r.added.second), context).toEqual(EMPTY);

		// A highlight changes no pick, and nothing is compared once it is
		// applied.
		expect(r.hover.top, context).toEqual(r.added.top);
		expect(nothingCompared(r.hover.second), context).toEqual(EMPTY);

		// A dynamic scene is compared as before (plain meshes: every
		// object, on every query; one instanced mesh is compared as a
		// whole and its slots only after it changed).
		if (!instancing)
			expect(r.dynamic.objectsValidated, context).toBeGreaterThan(
				COUNT / 2,
			);
		// And the scene is static again afterwards.
		expect(nothingCompared(r.afterDynamic.second), context).toEqual(EMPTY);
		expect(r.afterDynamic.top, context).toEqual(r.added.top);
	});
}
