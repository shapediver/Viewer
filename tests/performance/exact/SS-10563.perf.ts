import {expect, type Page} from "@playwright/test";
import {installPickWork} from "../fixtures/counters/picking";
import {ASSET_HOST, open, test} from "./harness";

/**
 * SS-10563: a pick costs the objects near the ray, not the object count.
 * GPU instances, lines and points used to be candidates for every ray: a
 * pick tested every instanced node and read the matrix of every instance,
 * and tested every line and points object.
 *
 * Each scene runs at two sizes. Per pick (`window.__pickWork`, from
 * `fixtures/counters/picking.ts`):
 * - `nodesTested`: the nodes the bounds hierarchy returned as candidates,
 * - `instancesTested`: instance matrices read (`InstancedMesh.getMatrixAt`),
 * - `objectsValidated`: objects compared with the scene (0: SS-10622).
 * The picks return the same hits as with GPU instancing switched off, and a
 * node moved with `updateNodeTransformation` is hit at its new place.
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
	queries: number;
	nodesTested: number;
	instancesTested: number;
	instanceBoundsReads: number;
	raycasts: number;
	objectsValidated: number;
	instancesChecked: number;
};

type Hit = {node: string; distance: number; normal: number[] | null};

type InstancesResult = {
	instancedMeshes: number;
	picks: Hit[][];
	reference: Hit[][];
	pick: Work;
	hovers: string[];
	hover: Work;
	moved: {old: string; new: string};
};

/** Instances whose box the pick rays go through (by grid index). */
const PICKED = [0, 7, 123, 499];
const REPEATS = 5;

async function measureInstances(
	page: Page,
	count: number,
): Promise<InstancesResult> {
	const name = `ss10563-${count}.glb`;
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
	return page.evaluate(
		async ({href, picked, repeats}) => {
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
			work.attach([...meshes][0]);

			// A point in the space of the node of an instance (the glTF is
			// Y-up, the viewer Z-up): the box spans -0.4..0.4 in x and y and
			// 0..0.8 in z there.
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
			// Down the z axis of the node: through the middle of an
			// instance, through the gap next to one, and outside the grid.
			const down = (index: number, x: number, y: number) => {
				const top = point(index, [x, y, 10]);
				const bottom = point(index, [x, y, 0]);
				return {
					origin: top,
					direction: [0, 1, 2].map((r) => (bottom[r] - top[r]) / 10),
				};
			};
			const rays = [
				...picked.map((index: number) => down(index, 0.1, 0.2)),
				down(picked[1], 1.1, 0.2),
				down(0, -5, -5),
			];
			// `+ 0` makes -0 a 0: the two paths multiply matrices differently.
			const round = (value: number) => Math.round(value * 1e4) / 1e4 + 0;
			const pickAll = (): Hit[][] =>
				rays.map((ray) =>
					perf.viewport
						.raytraceScene(ray.origin, ray.direction)
						.map((hit: any) => ({
							node: hit.node.name,
							distance: round(hit.distance),
							normal: hit.normal
								? Array.from(hit.normal as number[]).map(round)
								: null,
						})),
				);
			const perOperation = (total: Work, n: number): Work => ({
				queries: total.queries / n,
				nodesTested: total.nodesTested / n,
				instancesTested: total.instancesTested / n,
				instanceBoundsReads: total.instanceBoundsReads / n,
				raycasts: total.raycasts / n,
				objectsValidated: total.objectsValidated / n,
				instancesChecked: total.instancesChecked / n,
			});

			// The screen position of the middle of an instance.
			const screen = (index: number) =>
				perf.viewport.convert3Dto2D(point(index, [0, 0, 0.4])).client;
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
			const move = (p: number[]) =>
				engine.onPointerMove(
					new PointerEvent("pointermove", {
						clientX: p[0],
						clientY: p[1],
						pointerId: 1,
						buttons: 0,
					}),
				);

			// `convert3Dto2D` raycasts the whole scene (its `hidden`), so the
			// screen points are found before anything is counted.
			const points = picked.map((index: number) => screen(index));

			// warm-up: builds the hierarchies of both pick paths. The hover
			// highlight moves an instance to an effect mesh and back, so a
			// pick after it reads the slots of the changed meshes once.
			pickAll();
			move(points[0]);
			move([1, 1]);
			await perf.nextFrame();
			pickAll();

			work.reset();
			let picks: Hit[][] = [];
			for (let k = 0; k < repeats; k++) {
				const result = pickAll();
				if (k === 0) picks = result;
			}
			const pick = perOperation(work.read(), repeats * rays.length);

			work.reset();
			hovered.length = 0;
			for (const p of points) move(p);
			const hoverWork = perOperation(work.read(), picked.length);
			move([1, 1]);
			await perf.nextFrame();

			// The same picks with GPU instancing off: plain meshes, tested
			// without instances.
			perf.viewport.gpuInstancing.enabled = false;
			await perf.nextFrame();
			const reference = pickAll();
			perf.viewport.gpuInstancing.enabled = true;
			await perf.nextFrame();

			// A node moved by 1 along its x axis, into the gap next to it:
			// nothing emits a viewport update for this.
			const before = down(picked[1], 0.1, 0.2);
			const after = down(picked[1], 1.1, 0.2);
			const node = byName.get(`i${picked[1]}`);
			node.addTransformation({
				id: "shift",
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
			});
			node.updateVersion(false, false);
			perf.viewport.updateNodeTransformation(node);
			perf.viewport.render();
			await perf.nextFrame();
			const top = (ray: {origin: number[]; direction: number[]}) =>
				perf.viewport.raytraceScene(ray.origin, ray.direction)[0]?.node
					.name ?? "-";
			const moved = {old: top(before), new: top(after)};

			return {
				instancedMeshes: meshes.size,
				picks,
				reference,
				pick,
				// one name per hovered node, in order (an event can repeat)
				hovers: hovered.filter((n, i) => n !== hovered[i - 1]),
				hover: hoverWork,
				moved,
			};
		},
		{
			href: `${ASSET_HOST}/${name}`,
			picked: PICKED,
			repeats: REPEATS,
		},
	);
}

/** At most 20% more work on ten times the objects, plus one object. */
function bounded(large: number, small: number) {
	return large <= Math.max(small * 1.2, small + 1);
}

test("SS-10563 a pick or hover on instances tests the instances under the pointer, not all of them", async ({
	page,
	browser,
}) => {
	const small = await measureInstances(page, 500);
	const largePage = await browser.newPage();
	const large = await measureInstances(largePage, 5000);
	await largePage.close();
	const context = JSON.stringify({small, large});

	// The fixture is what it should be: one instanced mesh, the picks hit
	// the instance under the ray and nothing in the gaps.
	expect(small.instancedMeshes, context).toBe(1);
	expect(large.instancedMeshes, context).toBe(1);
	const names = [...PICKED.map((i) => `i${i}`), "-", "-"];
	expect(
		small.picks.map((hits) => hits[0]?.node ?? "-"),
		context,
	).toEqual(names);
	expect(
		large.picks.map((hits) => hits[0]?.node ?? "-"),
		context,
	).toEqual(names);
	expect(small.hovers, context).toEqual(PICKED.map((i) => `i${i}`));
	expect(large.hovers, context).toEqual(PICKED.map((i) => `i${i}`));

	// The same hits, distances and normals as without instancing.
	expect(small.picks, context).toEqual(small.reference);
	expect(large.picks, context).toEqual(large.reference);

	// A moved instance is hit at its new place and not at the old one.
	expect(small.moved, context).toEqual({old: "-", new: `i${PICKED[1]}`});
	expect(large.moved, context).toEqual({old: "-", new: `i${PICKED[1]}`});

	// The work of a pick and of a hover does not grow with the instances.
	for (const key of ["nodesTested", "instancesTested"] as const) {
		expect(
			bounded(large.pick[key], small.pick[key]),
			`pick.${key}: ${context}`,
		).toBe(true);
		expect(
			bounded(large.hover[key], small.hover[key]),
			`hover.${key}: ${context}`,
		).toBe(true);
	}
	// A pick straight down tests at most the one instance it hits.
	expect(large.pick.nodesTested, context).toBeLessThanOrEqual(1);
	expect(large.pick.instancesTested, context).toBeLessThanOrEqual(2);
	// Nothing changed between the picks: nothing is compared again.
	expect(large.pick.objectsValidated, context).toBe(0);
	expect(large.pick.instancesChecked, context).toBe(0);
});

type LinesResult = {
	picks: string[][];
	pick: Work;
	moved: {old: string; new: string};
};

/**
 * `count` line segments and `count` points objects on a grid, 4 apart: a
 * line at each grid point, a points object 2 above it.
 */
async function measureLines(page: Page, count: number): Promise<LinesResult> {
	await open(page);
	await page.evaluate(installPickWork);
	return page.evaluate(
		async ({count, repeats}) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			const work = (window as any).__pickWork;
			await perf.create({shadows: false});
			const columns = Math.ceil(Math.sqrt(count));
			const at = (index: number) => [
				(index % columns) * 4,
				Math.floor(index / columns) * 4,
			];
			const geometry = (values: number[], mode: number) => {
				const positions = new Float32Array(values);
				return new SDV.GeometryData(
					new SDV.PrimitiveData({
						POSITION: new SDV.AttributeData(
							positions,
							3,
							12,
							0,
							positions.length / 3,
							false,
							positions.length,
						),
					}),
					mode,
				);
			};
			const lineMaterial = new SDV.MaterialBasicLineData({
				color: "#ffffff",
			});
			const pointMaterial = new SDV.MaterialPointData({
				color: "#ffffff",
			});
			const nodes = new Map<string, any>();
			for (let i = 0; i < count; i++) {
				const [x, y] = at(i);
				const line = geometry(
					[x - 0.5, y, 0, x + 0.5, y, 0],
					SDV.PRIMITIVE_MODE.LINES,
				);
				line.material = lineMaterial;
				const lineNode = new SDV.TreeNode(`l${i}`);
				lineNode.addData(line);
				SDV.sceneTree.root.addChild(lineNode);
				nodes.set(`l${i}`, lineNode);
				const points = geometry(
					[x - 0.5, y + 2, 0, x + 0.5, y + 2, 0],
					SDV.PRIMITIVE_MODE.POINTS,
				);
				points.material = pointMaterial;
				const pointsNode = new SDV.TreeNode(`p${i}`);
				pointsNode.addData(points);
				SDV.sceneTree.root.addChild(pointsNode);
			}
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.viewport.camera.zoomTo(undefined, {duration: 0});
			await perf.nextFrame();
			// The line and points objects whose raycast a pick calls.
			const objectOf = (node: any) =>
				node.data[0].convertedObject[perf.viewport.id];
			work.attachRaycasts(
				objectOf(nodes.get("l0")),
				objectOf(
					SDV.sceneTree.root.children.find(
						(c: any) => c.name === "p0",
					),
				),
			);

			const picked = [0, 7, 42, 99];
			// Straight down near a line, near a points object, and between.
			const rays = [
				...picked.map((i) => [at(i)[0] + 0.2, at(i)[1] + 0.3]),
				...picked.map((i) => [at(i)[0] + 0.45, at(i)[1] + 2.2]),
				[at(7)[0] + 2, at(7)[1] + 1],
			];
			// raytraceScene keeps the raycaster's thresholds: 1 here, as no
			// interaction engine set other ones.
			const pickAll = () =>
				rays.map((p) =>
					perf.viewport
						.raytraceScene([p[0], p[1], 10], [0, 0, -1])
						.map((hit: any) => hit.node.name as string)
						// a points object has a hit per point near the ray
						.filter(
							(name: string, i: number, names: string[]) =>
								names.indexOf(name) === i,
						),
				);
			pickAll();
			work.reset();
			let picks: string[][] = [];
			for (let k = 0; k < repeats; k++) {
				const result = pickAll();
				if (k === 0) picks = result;
			}
			const total = work.read();
			const n = repeats * rays.length;
			const pick = {
				queries: total.queries / n,
				nodesTested: total.nodesTested / n,
				instancesTested: total.instancesTested / n,
				instanceBoundsReads: total.instanceBoundsReads / n,
				raycasts: total.raycasts / n,
				objectsValidated: total.objectsValidated / n,
				instancesChecked: total.instancesChecked / n,
			};

			// A line moved 2 to the side, into the gap.
			const node = nodes.get("l7");
			node.addTransformation({
				id: "shift",
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1],
			});
			node.updateVersion(false, false);
			perf.viewport.updateNodeTransformation(node);
			perf.viewport.render();
			await perf.nextFrame();
			const top = (p: number[]) =>
				perf.viewport.raytraceScene([p[0], p[1], 10], [0, 0, -1])[0]
					?.node.name ?? "-";
			const moved = {
				old: top([at(7)[0] + 0.2, at(7)[1] + 0.3]),
				new: top([at(7)[0] + 2.2, at(7)[1] + 0.3]),
			};
			return {picks, pick, moved};
		},
		{count, repeats: REPEATS},
	);
}

test("SS-10563 a pick near lines and points tests the objects near the ray, not all of them", async ({
	page,
	browser,
}) => {
	const small = await measureLines(page, 100);
	const largePage = await browser.newPage();
	const large = await measureLines(largePage, 1000);
	await largePage.close();
	const context = JSON.stringify({small, large});

	const expected = [
		["l0"],
		["l7"],
		["l42"],
		["l99"],
		["p0"],
		["p7"],
		["p42"],
		["p99"],
		[],
	];
	expect(small.picks, context).toEqual(expected);
	expect(large.picks, context).toEqual(expected);
	expect(small.moved, context).toEqual({old: "-", new: "l7"});
	expect(large.moved, context).toEqual({old: "-", new: "l7"});

	for (const key of ["nodesTested", "raycasts"] as const)
		expect(
			bounded(large.pick[key], small.pick[key]),
			`pick.${key}: ${context}`,
		).toBe(true);
	// The objects within the threshold of the ray: the one it hits.
	expect(large.pick.nodesTested, context).toBeLessThanOrEqual(1);
	expect(large.pick.raycasts, context).toBeLessThanOrEqual(1);
	// Every query still compares every line and points object with the
	// scene (`objectsValidated` grows with the scene): SS-10642 skips that
	// while nothing changed.
});
