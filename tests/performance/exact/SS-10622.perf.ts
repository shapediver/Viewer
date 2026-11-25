import {expect, type Page} from "@playwright/test";
import {ASSET_HOST, open, test} from "./harness";

/**
 * SS-10622: picking and hovering instanced meshes got slower with the
 * bounds hierarchy of SS-10393. A node whose geometry converts to an
 * instanced mesh is a candidate for every ray, so the hierarchy cannot
 * leave it out; it compared every such node with the scene on every pick
 * anyway, and the pick called the raycast of every group and instance
 * placeholder below it, which finds nothing.
 *
 * The scene: one box mesh placed by N glTF nodes on a grid, which the GPU
 * instancing turns into one instanced mesh. Per pick and per hover, on 500
 * and on 5,000 instances:
 * - `objectsValidated`: objects the hierarchy compared with the scene
 *   (`globalThis.__nodeBoundsStats`, written only if a test created it),
 * - `emptyRaycasts`: calls of the raycast of `Object3D`, which finds nothing.
 * Both are 0 when nothing of this grows with the instance count.
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

type Work = {
	instancedMeshes: number;
	picks: string[];
	pick: {objectsValidated: number; emptyRaycasts: number};
	hovers: string[];
	hover: {objectsValidated: number; emptyRaycasts: number};
};

const PICKED = [0, 7, 123, 499];
const PICKS = 10;

async function measure(page: Page, count: number): Promise<Work> {
	const name = `ss10622-${count}.glb`;
	const glb = instancesGlb(count);
	await page.route(`${ASSET_HOST}/${name}`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	await open(page);
	return page.evaluate(
		async ({href, picked, picks}) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			const {InteractionEngine, HoverManager, InteractionData} = (
				window as any
			).SDVInteractions;
			await perf.create({shadows: false});
			const stats = {queries: 0, objectsChecked: 0, rebuilds: 0};
			(globalThis as any).__nodeBoundsStats = stats;
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
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.viewport.camera.zoomTo(undefined, {duration: 0});
			await perf.nextFrame();

			let placeholder: any = null;
			const viewportId = perf.viewport.id;
			for (const node of byName.values())
				node.convertedObject[viewportId]?.traverse((object: any) => {
					if (object.userData.isInstanced) placeholder ??= object;
				});
			const meshes = new Set<any>();
			for (const node of byName.values())
				for (const data of node.data) {
					const converted = data.convertedObject?.[viewportId];
					if (converted?.isInstancedMesh) meshes.add(converted);
				}
			const instancedMeshes = meshes.size;
			if (!placeholder) throw new Error("no instance placeholder");

			// The raycast of Object3D, which finds nothing.
			let proto = Object.getPrototypeOf(placeholder);
			while (
				proto &&
				!Object.prototype.hasOwnProperty.call(proto, "raycast")
			)
				proto = Object.getPrototypeOf(proto);
			const empty = proto.raycast;
			let emptyRaycasts = 0;
			proto.raycast = function (this: any, ...args: any[]) {
				emptyRaycasts++;
				return empty.apply(this, args);
			};

			const engine = new InteractionEngine(perf.viewport);
			const hover = new HoverManager();
			hover.effectMaterial = new SDV.MaterialStandardData({
				color: "#dddddd",
			});
			engine.addInteractionManager(hover);
			const hovered: string[] = [];
			SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) =>
				hovered.push(...(e.nodes ?? []).map((n: any) => n.name)),
			);
			// The middle of the box of a node, in the world, and where it is
			// on the screen.
			const center = (node: any) => {
				const object = node.convertedObject[viewportId];
				object.updateWorldMatrix(true, false);
				const e = object.matrixWorld.elements;
				return [0, 1, 2].map((r) => e[8 + r] * 0.4 + e[12 + r]);
			};
			const screen = (node: any) =>
				perf.viewport.convert3Dto2D(center(node)).client;
			const move = (x: number, y: number) =>
				engine.onPointerMove(
					new PointerEvent("pointermove", {
						clientX: x,
						clientY: y,
						pointerId: 1,
						buttons: 0,
					}),
				);

			// warm-up: builds the hierarchies of both pick paths
			const pickAt = (p: number[]) => {
				const ray = perf.viewport.pointerEventToRay({
					clientX: p[0],
					clientY: p[1],
				});
				return perf.viewport.raytraceScene(ray.origin, ray.direction);
			};
			const warm = screen(byName.get("i0"));
			pickAt(warm);
			move(warm[0], warm[1]);
			move(1, 1);
			await perf.nextFrame();

			const points = picked.map((index: number) =>
				screen(byName.get(`i${index}`)),
			);
			const pickNames: string[] = [];
			stats.objectsChecked = 0;
			emptyRaycasts = 0;
			for (let k = 0; k < picks; k++)
				for (const p of points) {
					const hits = pickAt(p);
					if (k === 0) pickNames.push(hits[0]?.node.name ?? "-");
				}
			const n = picks * picked.length;
			const pick = {
				objectsValidated: stats.objectsChecked / n,
				emptyRaycasts: emptyRaycasts / n,
			};

			stats.objectsChecked = 0;
			emptyRaycasts = 0;
			hovered.length = 0;
			for (const p of points) move(p[0], p[1]);
			const hoverWork = {
				objectsValidated: stats.objectsChecked / picked.length,
				emptyRaycasts: emptyRaycasts / picked.length,
			};
			proto.raycast = empty;
			return {
				instancedMeshes,
				picks: pickNames,
				pick,
				// one name per hovered node, in order (an event can repeat)
				hovers: hovered.filter((n, i) => n !== hovered[i - 1]),
				hover: hoverWork,
			};
		},
		{href: `${ASSET_HOST}/${name}`, picked: PICKED, picks: PICKS},
	);
}

test("SS-10622 a pick or hover on instances compares no objects and calls no empty raycasts", async ({
	page,
	browser,
}) => {
	const small = await measure(page, 500);
	const largePage = await browser.newPage();
	const large = await measure(largePage, 5000);
	await largePage.close();
	const context = JSON.stringify({small, large});

	// The fixture is what it should be: one instanced mesh, and the pick and
	// the hover find the instance under the pointer.
	expect(small.instancedMeshes, context).toBe(1);
	expect(large.instancedMeshes, context).toBe(1);
	const names = PICKED.map((i) => `i${i}`);
	expect(small.picks, context).toEqual(names);
	expect(large.picks, context).toEqual(names);
	expect(small.hovers, context).toEqual(names);
	expect(large.hovers, context).toEqual(names);

	// Nothing is compared or raycast for nothing, at any instance count.
	expect(large.pick.objectsValidated, context).toBe(0);
	expect(large.pick.emptyRaycasts, context).toBe(0);
	expect(large.hover.objectsValidated, context).toBe(0);
	expect(large.hover.emptyRaycasts, context).toBe(0);
	expect(small.pick, context).toEqual(large.pick);
	expect(small.hover, context).toEqual(large.hover);
});
