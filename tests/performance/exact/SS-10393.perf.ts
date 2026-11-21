import {expect, type Page} from "@playwright/test";
import {open, test} from "./harness";

const raytrace = async (page: Page) => {
	await open(page);
	return page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		const indices = new Uint16Array([0, 1, 2]);
		const geometry = new SDV.GeometryData(
			new SDV.PrimitiveData(
				{
					POSITION: new SDV.AttributeData(
						positions,
						3,
						12,
						0,
						4,
						false,
						positions.length,
					),
				},
				new SDV.AttributeData(
					indices,
					1,
					2,
					0,
					2,
					false,
					indices.length,
				),
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		geometry.material = new SDV.MaterialUnlitData({color: "#00ff00"});
		const node = new SDV.TreeNode("triangle");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const hits = perf.viewport.raytraceScene([0.2, 0.2, 1], [0, 0, -1]);
		return {
			count: hits.length,
			distance: hits[0]?.distance ?? null,
		};
	});
};

// Regression test for picking: it passes today and must keep passing.
test("SS-10393 a ray hits the known triangle", async ({page}) => {
	const hit = await raytrace(page);
	expect(hit.count).toBe(1);
	expect(hit.distance).toBeCloseTo(1, 4);
});

/**
 * Tools for the picking tests, as `window.__pick`.
 *
 * `ray` counts, since the last reset:
 * - `calls`: calls of `Mesh.raycast` and `BatchedMesh.raycast`,
 * - `hiddenSource`: calls of `Mesh.raycast` on the hidden source mesh of a
 *   batched member,
 * - `batchBounds`: calls of `getBoundingSphereAt` inside `BatchedMesh.raycast`,
 * - `picks`: calls of `viewport.pointerEventToRay`, one per pointer event the
 *   interaction feature picked for.
 * `attach()` wraps the prototypes. Call it after the scene was drawn once.
 */
function installPickingTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	const ray = {calls: 0, hiddenSource: 0, batchBounds: 0, picks: 0};
	const hits: string[] = [];
	const info = {batches: 0, sources: 0};
	let scene: any = null;
	const protoWith = (object: any, name: string) => {
		let proto = Object.getPrototypeOf(object);
		while (proto && !Object.prototype.hasOwnProperty.call(proto, name))
			proto = Object.getPrototypeOf(proto);
		return proto;
	};
	function attach() {
		const protos = new Set<any>();
		let batch: any = null;
		scene.traverse((object: any) => {
			if (object.userData.batchedMesh != null) info.sources++;
			if (object.isBatchedMesh) {
				batch = object;
				info.batches++;
			} else if (object.isMesh && !object.isInstancedMesh)
				protos.add(protoWith(object, "raycast"));
		});
		for (const proto of protos) {
			const original = proto.raycast;
			proto.raycast = function (this: any, ...args: any[]) {
				ray.calls++;
				if (this.userData.batchedMesh != null) ray.hiddenSource++;
				return original.apply(this, args);
			};
		}
		if (batch) {
			const proto = protoWith(batch, "raycast");
			const original = proto.raycast;
			const boundsProto = protoWith(batch, "getBoundingSphereAt");
			const originalBounds = boundsProto.getBoundingSphereAt;
			let inside = 0;
			boundsProto.getBoundingSphereAt = function (
				this: any,
				...args: any[]
			) {
				if (inside > 0) ray.batchBounds++;
				return originalBounds.apply(this, args);
			};
			proto.raycast = function (this: any, ...args: any[]) {
				ray.calls++;
				inside++;
				try {
					return original.apply(this, args);
				} finally {
					inside--;
				}
			};
		}
		const toRay = perf.viewport.pointerEventToRay.bind(perf.viewport);
		perf.viewport.pointerEventToRay = (event: any) => {
			ray.picks++;
			return toRay(event);
		};
	}
	function reset() {
		ray.calls = 0;
		ray.hiddenSource = 0;
		ray.batchBounds = 0;
		ray.picks = 0;
		hits.length = 0;
	}
	const centers: number[][] = [];
	function boxes(columns: number, rows: number, material: any) {
		let index = 0;
		const nodes: any[] = [];
		for (let j = 0; j < rows; j++)
			for (let i = 0; i < columns; i++) {
				const geometry = perf.boxGeometry(
					[i * 2, j * 2, 0],
					[i * 2 + 1, j * 2 + 1, 1],
				);
				geometry.material =
					typeof material === "function"
						? material(index++)
						: material;
				const node = new SDV.TreeNode(`box_${i}_${j}`);
				node.addData(geometry);
				SDV.sceneTree.root.addChild(node);
				nodes.push(node);
				centers.push([i * 2 + 0.5, j * 2 + 0.5, 0.5]);
			}
		return nodes;
	}
	function material(options: any = {}) {
		return new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
			...options,
		});
	}
	/**
	 * A material of its own for each box. The batch manager groups meshes by
	 * material properties except the color, so a box with a roughness of its
	 * own stays a mesh of its own, and a pick over many of them shows the
	 * cost of testing meshes.
	 */
	function separate(index: number) {
		return material({roughness: 0.2 + index / 1000});
	}
	/** Hover on the nodes with the public interaction feature. */
	function hover(nodes: any[]) {
		const {InteractionEngine, HoverManager, InteractionData} = (
			window as any
		).SDVInteractions;
		for (const node of nodes)
			node.addData(new InteractionData({hover: true}));
		const engine = new InteractionEngine(perf.viewport);
		const manager = new HoverManager();
		manager.effectMaterial = new SDV.MaterialStandardData({
			color: "#dddddd",
		});
		engine.addInteractionManager(manager);
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (event: any) => {
			hits.push(...(event.nodes ?? []).map((node: any) => node.name));
		});
	}
	/**
	 * The pixel of a 7 x 7 grid over the canvas whose ray hits nothing and
	 * passes farthest from the centers of the boxes made by `boxes` (a
	 * batch is tested when the ray gets close to one of them). Call it before
	 * `attach`: it raytraces.
	 */
	function findMiss() {
		const rect = perf.renderer.domElement.getBoundingClientRect();
		let best: {x: number; y: number; clearance: number} | null = null;
		for (let row = 0; row < 7; row++)
			for (let column = 0; column < 7; column++) {
				const x = rect.x + 4 + ((rect.width - 8) * column) / 6;
				const y = rect.y + 4 + ((rect.height - 8) * row) / 6;
				const ray = perf.viewport.pointerEventToRay(
					new PointerEvent("pointermove", {clientX: x, clientY: y}),
				);
				if (
					perf.viewport.raytraceScene(ray.origin, ray.direction)
						.length > 0
				)
					continue;
				const length = Math.hypot(...ray.direction);
				let clearance = Infinity;
				for (const c of centers) {
					const v = [
						c[0] - ray.origin[0],
						c[1] - ray.origin[1],
						c[2] - ray.origin[2],
					];
					const d = ray.direction.map((e: number) => e / length);
					const cross = [
						d[1] * v[2] - d[2] * v[1],
						d[2] * v[0] - d[0] * v[2],
						d[0] * v[1] - d[1] * v[0],
					];
					clearance = Math.min(clearance, Math.hypot(...cross));
				}
				if (!best || clearance > best.clearance)
					best = {x, y, clearance};
			}
		if (!best) throw new Error("every pixel of the grid hits a box");
		return best;
	}
	/** The page coordinates of a world point. */
	function client(point: number[]) {
		const projected = perf.viewport.convert3Dto2D(point).client;
		return {x: projected[0], y: projected[1]};
	}
	/** Show the scene and draw it once. */
	async function show() {
		const render = perf.renderer.render.bind(perf.renderer);
		perf.renderer.render = (s: any, camera: any) => {
			scene = s;
			return render(s, camera);
		};
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
	}
	(window as any).__pick = {
		ray,
		hits,
		info,
		attach,
		reset,
		boxes,
		material,
		separate,
		hover,
		client,
		findMiss,
		show,
	};
}

/** Each pick may test this many meshes. The plain loop tests every node. */
const RAYCASTS_PER_PICK = 20;

async function movePointer(page: Page, x: number, y: number) {
	await page.mouse.move(x, y);
	await page.waitForTimeout(250);
}

test("SS-10393 a ray tests only the nodes it can hit and returns the same hits", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installPickingTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const pick = (window as any).__pick;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		pick.boxes(20, 20, pick.separate);
		// A box on box_3_4, and a line segment far from the grid.
		const stacked = perf.boxGeometry([6, 8, 2], [7, 9, 3]);
		stacked.material = pick.separate(450);
		const top = new SDV.TreeNode("stacked");
		top.addData(stacked);
		SDV.sceneTree.root.addChild(top);
		const positions = new Float32Array([100, 0, 0.5, 100, 5, 0.5]);
		const line = new SDV.GeometryData(
			new SDV.PrimitiveData({
				POSITION: new SDV.AttributeData(
					positions,
					3,
					12,
					0,
					2,
					false,
					positions.length,
				),
			}),
			SDV.PRIMITIVE_MODE.LINES,
		);
		line.material = new SDV.MaterialBasicLineData({color: "#ffffff"});
		const lineNode = new SDV.TreeNode("line");
		lineNode.addData(line);
		SDV.sceneTree.root.addChild(lineNode);
		await pick.show();
		pick.attach();

		const cast = (origin: number[]) => {
			pick.reset();
			const hits = perf.viewport
				.raytraceScene(origin, [0, 0, -1])
				.map((hit: any) => ({
					node: hit.node.name,
					distance: Math.round(hit.distance * 1e4) / 1e4,
				}));
			return {hits, calls: pick.ray.calls};
		};
		return {
			single: cast([10.3, 4.6, 10]),
			stacked: cast([6.3, 8.6, 10]),
			line: cast([100.5, 2, 10]),
			miss: cast([-5, -5, 10]),
		};
	});
	expect(result.single.hits[0], JSON.stringify(result)).toEqual({
		node: "box_5_2",
		distance: 9,
	});
	// Front faces only: the upper box first, then the box below it.
	expect(result.stacked.hits, JSON.stringify(result)).toEqual([
		{node: "stacked", distance: 7},
		{node: "box_3_4", distance: 9},
	]);
	expect(
		result.line.hits.map((hit: any) => hit.node),
		JSON.stringify(result),
	).toContain("line");
	expect(result.miss.hits, JSON.stringify(result)).toEqual([]);
	for (const [name, cast] of Object.entries(result) as [string, any][])
		expect(
			cast.calls,
			`${name}: ${JSON.stringify(result)}`,
		).toBeLessThanOrEqual(RAYCASTS_PER_PICK);
});

test("SS-10393 hover over 400 interactive boxes names the node with few raycasts", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installPickingTools);
	const target = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const pick = (window as any).__pick;
		await perf.create({shadows: false});
		pick.hover(pick.boxes(20, 20, pick.separate));
		await pick.show();
		const miss = pick.findMiss();
		pick.attach();
		return {miss, ...pick.client([10.3, 4.6, 1])};
	});
	await movePointer(page, target.miss.x, target.miss.y);
	await page.evaluate(() => (window as any).__pick.reset());
	await movePointer(page, target.x, target.y);
	const result = await page.evaluate(() => {
		const pick = (window as any).__pick;
		return {hits: [...pick.hits], ...pick.ray};
	});
	expect(result.hits, JSON.stringify(result)).toEqual(["box_5_2"]);
	expect(result.picks, JSON.stringify(result)).toBeGreaterThan(0);
	expect(result.calls, JSON.stringify(result)).toBeLessThanOrEqual(
		RAYCASTS_PER_PICK * result.picks,
	);
});

test("SS-10393 a moved node is hit at its new place and not at the old one", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installPickingTools);
	const setup = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const pick = (window as any).__pick;
		await perf.create({shadows: false});
		const nodes = pick.boxes(20, 20, pick.separate);
		pick.hover(nodes);
		await pick.show();
		const miss = pick.findMiss();
		pick.attach();
		return {
			miss,
			before: pick.client([10.3, 4.6, 1]),
			after: pick.client([11.3, 4.6, 1]),
		};
	});
	const corner = [setup.miss.x, setup.miss.y];
	await movePointer(page, corner[0], corner[1]);
	await movePointer(page, setup.before.x, setup.before.y);
	await movePointer(page, corner[0], corner[1]);
	// The box moves into the gap next to its column. Nothing emits a
	// viewport update for this.
	const direct = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const node = SDV.sceneTree.root.children.find(
			(child: any) => child.name === "box_5_2",
		);
		node.addTransformation({
			id: "move",
			matrix: new Float32Array([
				1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,
			]),
		});
		node.updateVersion(false, false);
		perf.viewport.updateNodeTransformation(node);
		perf.viewport.render();
		await perf.nextFrame();
		const pick = (window as any).__pick;
		const cast = (x: number) => {
			pick.reset();
			const hits = perf.viewport
				.raytraceScene([x, 4.6, 10], [0, 0, -1])
				.map((hit: any) => hit.node.name);
			return {hits, calls: pick.ray.calls};
		};
		const direct = {atNew: cast(11.3), atOld: cast(10.3)};
		pick.reset();
		return direct;
	});
	expect(direct.atNew, JSON.stringify(direct)).toEqual({
		hits: ["box_5_2"],
		calls: 1,
	});
	expect(direct.atOld, JSON.stringify(direct)).toEqual({hits: [], calls: 0});
	await movePointer(page, setup.after.x, setup.after.y);
	const atNew = await page.evaluate(() => {
		const pick = (window as any).__pick;
		return {hits: [...pick.hits], ...pick.ray};
	});
	await movePointer(page, corner[0], corner[1]);
	await page.evaluate(() => (window as any).__pick.reset());
	await movePointer(page, setup.before.x, setup.before.y);
	const atOld = await page.evaluate(() => {
		const pick = (window as any).__pick;
		return {hits: [...pick.hits], ...pick.ray};
	});
	expect(atNew.hits, JSON.stringify(atNew)).toEqual(["box_5_2"]);
	expect(atNew.calls, JSON.stringify(atNew)).toBeLessThanOrEqual(
		RAYCASTS_PER_PICK * atNew.picks,
	);
	expect(atOld.hits, JSON.stringify(atOld)).toEqual([]);
	expect(atOld.calls, JSON.stringify(atOld)).toBeLessThanOrEqual(
		RAYCASTS_PER_PICK * atOld.picks,
	);
});

test("SS-10393 a replaced geometry is hit where only the new one reaches", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installPickingTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const pick = (window as any).__pick;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		pick.boxes(20, 20, pick.separate);
		await pick.show();
		pick.attach();
		const cast = () => {
			pick.reset();
			const hits = perf.viewport
				.raytraceScene([-1, -0.6, 10], [0, 0, -1])
				.map((hit: any) => hit.node.name);
			return {hits, calls: pick.ray.calls};
		};
		// The ray is outside box_0_0.
		const before = cast();
		const node = SDV.sceneTree.root.children.find(
			(child: any) => child.name === "box_0_0",
		);
		const larger = perf.boxGeometry([-1.5, -1.5, 0], [1.5, 1.5, 1]);
		larger.material = pick.separate(451);
		node.removeData(node.data[0]);
		node.addData(larger);
		perf.viewport.updateNode(node);
		await perf.nextFrame();
		const after = cast();
		return {before, after};
	});
	expect(result.before.hits, JSON.stringify(result)).toEqual([]);
	expect(result.after.hits, JSON.stringify(result)).toEqual(["box_0_0"]);
	expect(result.before.calls, JSON.stringify(result)).toBeLessThanOrEqual(
		RAYCASTS_PER_PICK,
	);
	expect(result.after.calls, JSON.stringify(result)).toBeLessThanOrEqual(
		RAYCASTS_PER_PICK,
	);
});

test("SS-10393 batched boxes: no hidden source is raycast and a miss reads no batch bounds", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installPickingTools);
	const setup = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const pick = (window as any).__pick;
		await perf.create({shadows: false});
		// 400 boxes with one material end up in batches.
		pick.hover(pick.boxes(20, 20, pick.material()));
		await pick.show();
		const miss = pick.findMiss();
		pick.attach();
		return {
			info: {...pick.info},
			miss,
			target: pick.client([10.3, 4.6, 1]),
		};
	});
	// The boxes must really be batch members, or the test says nothing.
	expect(setup.info.batches, JSON.stringify(setup.info)).toBeGreaterThan(0);
	expect(setup.info.sources, JSON.stringify(setup.info)).toBeGreaterThan(300);
	await page.evaluate(() => (window as any).__pick.reset());
	await movePointer(page, setup.miss.x, setup.miss.y);
	const miss = await page.evaluate(() => {
		const pick = (window as any).__pick;
		const result = {...pick.ray};
		pick.reset();
		return result;
	});
	await movePointer(page, setup.target.x, setup.target.y);
	const hit = await page.evaluate(() => {
		const pick = (window as any).__pick;
		return {hits: [...pick.hits], ...pick.ray};
	});
	expect(hit.hits, JSON.stringify({miss, hit})).toEqual(["box_5_2"]);
	expect(hit.hiddenSource, JSON.stringify({miss, hit})).toBe(0);
	expect(miss.hiddenSource, JSON.stringify({miss, hit})).toBe(0);
	expect(miss.batchBounds, JSON.stringify({miss, hit})).toBe(0);
});
