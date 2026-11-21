import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10477: a scene update touches only the batches that contain changed
 * nodes, and inside them only the changed members.
 *
 * Two materials that differ in roughness give two batches. Counts and object
 * identity only: no pixels, no timing. Software-safe, shadows are off.
 */

/** Runs in the page. Adds `window.__b`. */
function installBatchTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;

	function scene(viewport: any = perf.viewport) {
		return viewport.threeJsCoreObjects.scene;
	}

	function batches(viewport: any = perf.viewport) {
		const found: any[] = [];
		scene(viewport).traverse((object: any) => {
			if (object.isBatchedMesh) found.push(object);
		});
		return found;
	}

	/** Meshes of the scene that are drawn on their own. */
	function visibleMeshes(viewport: any = perf.viewport) {
		let count = 0;
		scene(viewport).traverse((object: any) => {
			if (object.isMesh && !object.isBatchedMesh && object.visible)
				if (object.userData.SDtype === "geometry") count++;
		});
		return count;
	}

	/** One triangle fan per `triangles`: a geometry with more vertices than a box. */
	function bigGeometry(triangles: number, material: any) {
		const positions = new Float32Array(triangles * 9);
		for (let t = 0; t < triangles; t++) {
			const o = t * 9;
			positions.set([0, 0, 0, 1, 0, 0, 0, 1, 0], o);
			for (let i = 0; i < 9; i += 3) positions[o + i + 2] += t * 0.01;
		}
		const indices = new Uint16Array(triangles * 3);
		for (let i = 0; i < indices.length; i++) indices[i] = i;
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
		geometry.material = material;
		return geometry;
	}

	/**
	 * Wraps the writes into batches. Call it once a batch exists. `read()`
	 * gives the writes since the last `reset()`, per batch object.
	 */
	function watch() {
		const first = batches()[0];
		if (!first) throw new Error("There is no batch to watch");
		const proto = Object.getPrototypeOf(first);
		if (!proto.__watched) {
			proto.__watched = true;
			const state = {
				vertices: new Map<any, number>(),
				matrices: 0,
				instances: 0,
			};
			(window as any).__bState = state;
			const wrap = (
				name: string,
				count: (self: any, args: any[]) => void,
			) => {
				const original = proto[name];
				proto[name] = function (...args: any[]) {
					count(this, args);
					return original.apply(this, args);
				};
			};
			const copied = (self: any, geometry: any) =>
				state.vertices.set(
					self,
					(state.vertices.get(self) ?? 0) +
						geometry.getAttribute("position").count,
				);
			// addGeometry copies through setGeometryAt, so this counts both.
			wrap("setGeometryAt", (self, args) => copied(self, args[1]));
			wrap("setMatrixAt", () => state.matrices++);
			wrap("addInstance", () => state.instances++);
		}
		const state = (window as any).__bState;
		const reset = () => {
			state.vertices.clear();
			state.matrices = 0;
			state.instances = 0;
		};
		reset();
		return {
			reset,
			read: () => ({
				vertices: new Map(state.vertices) as Map<any, number>,
				matrices: state.matrices as number,
				instances: state.instances as number,
			}),
		};
	}

	/**
	 * `count` boxes with material A and `count` with material B, side by
	 * side. Equal materials but for the roughness: two batches.
	 */
	function twoBatches(count: number) {
		const a = new SDV.MaterialStandardData({
			color: "#66cc88",
			roughness: 0.4,
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const b = new SDV.MaterialStandardData({
			color: "#cc6688",
			roughness: 0.8,
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const nodes: {a: any[]; b: any[]; materialA: any; materialB: any} = {
			a: [],
			b: [],
			materialA: a,
			materialB: b,
		};
		for (let i = 0; i < count; i++) {
			for (const [list, material, x] of [
				[nodes.a, a, 0],
				[nodes.b, b, 3],
			] as const) {
				const geometry = perf.boxGeometry(
					[x, i * 1.2, 0],
					[x + 0.8, i * 1.2 + 0.8, 0.8],
				);
				geometry.material = material;
				const node = new SDV.TreeNode(
					`${list === nodes.a ? "a" : "b"}${i}`,
				);
				node.addData(geometry);
				SDV.sceneTree.root.addChild(node);
				list.push(node);
			}
		}
		SDV.sceneTree.root.updateVersion();
		return nodes;
	}

	(window as any).__b = {
		scene,
		batches,
		visibleMeshes,
		bigGeometry,
		watch,
		twoBatches,
	};
}

test("SS-10477 replacing one batched member leaves the other batch alone", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(6);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const before = b.batches();
		const watcher = b.watch();

		// A new geometry for one member of batch A, as a parameter change
		// that replaces an output does.
		const target = nodes.a[2];
		const old = target.data[0];
		const replacement = perf.boxGeometry([0, 2.4, 0], [1.2, 3.2, 1.2]);
		replacement.material = nodes.materialA;
		target.removeData(old);
		target.addData(replacement);
		target.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();

		const after = b.batches();
		const writes = watcher.read();
		const holder = (node: any) =>
			node.data[0].convertedObject[perf.viewport.id].userData.batchedMesh;
		const batchOfA = holder(nodes.a[0]);
		const batchOfB = holder(nodes.b[0]);
		return {
			batchCount: [before.length, after.length],
			sameObjects: before.map((batch: any) => after.includes(batch)),
			// vertices written into the batch of B
			verticesIntoB: writes.vertices.get(batchOfB) ?? 0,
			// A box is 8 vertices, a chunk of six is 48 (plus the new one)
			verticesIntoA: writes.vertices.get(batchOfA) ?? 0,
			// the replaced member is drawn from the batch with its new geometry
			replacedBatched: Boolean(holder(target)),
			replacedInA: holder(target) === batchOfA,
			singles: b.visibleMeshes(),
		};
	});

	expect(result.batchCount).toEqual([2, 2]);
	// Batch B is the same object it was, and nothing was written into it.
	expect(result.verticesIntoB, "vertices written into the other batch").toBe(
		0,
	);
	const untouched = result.sameObjects.filter(Boolean).length;
	expect(untouched, "batches that are still the same object").toBeGreaterThan(
		0,
	);
	// At most the chunk of the member is rebuilt: its six boxes plus the new
	// geometry. An in-place update writes 8 vertices.
	expect(result.verticesIntoA).toBeLessThanOrEqual(8 * 7);
	expect(result.replacedBatched).toBe(true);
	expect(result.replacedInA).toBe(true);
	expect(result.singles).toBe(0);
});

test("SS-10477 hiding one batched member applies one member", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(8);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const before = b.batches();
		const watcher = b.watch();

		const target = nodes.b[3];
		target.visible = false;
		target.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();

		const mesh = target.data[0].convertedObject[perf.viewport.id];
		const batch = mesh.userData.batchedMesh;
		return {
			sameBatches: b.batches().every((x: any) => before.includes(x)),
			matrixWrites: watcher.read().matrices,
			hidden: batch.getVisibleAt(mesh.userData.batchId),
			otherVisible: (() => {
				const other =
					nodes.b[4].data[0].convertedObject[perf.viewport.id];
				return other.userData.batchedMesh.getVisibleAt(
					other.userData.batchId,
				);
			})(),
		};
	});

	expect(result.sameBatches).toBe(true);
	// One of sixteen members. The whole scene was applied again before.
	expect(result.matrixWrites).toBe(1);
	expect(result.hidden).toBe(false);
	expect(result.otherVisible).toBe(true);
});

test("SS-10477 a hidden ancestor hides every batched member below it", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const group = new SDV.TreeNode("group");
		const leaves: any[] = [];
		for (let i = 0; i < 6; i++) {
			const geometry = perf.boxGeometry(
				[0, i * 1.2, 0],
				[0.8, i * 1.2 + 0.8, 0.8],
			);
			geometry.material = material;
			const mid = new SDV.TreeNode(`mid${i}`, group);
			const leaf = new SDV.TreeNode(`leaf${i}`, mid);
			leaf.addData(geometry);
			leaves.push(leaf);
		}
		SDV.sceneTree.root.addChild(group);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const visibleOf = () =>
			leaves.map((leaf) => {
				const mesh = leaf.data[0].convertedObject[perf.viewport.id];
				return mesh.userData.batchedMesh.getVisibleAt(
					mesh.userData.batchId,
				);
			});
		const shown = visibleOf();
		const before = b.batches();
		group.visible = false;
		group.updateVersion();
		perf.viewport.update();
		const hidden = visibleOf();
		group.visible = true;
		group.updateVersion();
		perf.viewport.update();
		const again = visibleOf();
		return {
			shown,
			hidden,
			again,
			sameBatches:
				b.batches().length === before.length &&
				b.batches().every((x: any) => before.includes(x)),
		};
	});

	expect(result.shown).toEqual(Array(6).fill(true));
	expect(result.hidden).toEqual(Array(6).fill(false));
	expect(result.again).toEqual(Array(6).fill(true));
	expect(result.sameBatches).toBe(true);
});

test("SS-10477 a batch grows with the members added to it", async ({page}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const add = (i: number) => {
			const geometry = perf.boxGeometry(
				[0, i * 1.2, 0],
				[0.8, i * 1.2 + 0.8, 0.8],
			);
			geometry.material = material;
			const node = new SDV.TreeNode(`box${i}`);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
			return node;
		};
		// One box stays a mesh: a batch of one is one draw already.
		add(0);
		const alone = {batches: b.batches().length, meshes: b.visibleMeshes()};
		add(1);
		const first = b.batches()[0];
		const watcher = b.watch();
		for (let i = 2; i < 9; i++) add(i);
		await perf.nextFrame();
		return {
			alone,
			batches: b.batches().length,
			sameObject: b.batches()[0] === first,
			instances: b.batches()[0].instanceCount,
			singles: b.visibleMeshes(),
			// Seven additions write seven boxes, not 2 + 3 + .. + 9
			vertices: [...watcher.read().vertices.values()].reduce(
				(sum: number, n: number) => sum + n,
				0,
			),
		};
	});

	expect(result.alone).toEqual({batches: 0, meshes: 1});
	expect(result.batches).toBe(1);
	expect(result.instances).toBe(9);
	expect(result.singles).toBe(0);
	expect(result.sameObject, "the batch is the object it was").toBe(true);
	expect(result.vertices).toBe(7 * 8);
});

test("SS-10477 a member with a larger geometry still fits its batch", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(5);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const before = b.batches();
		const target = nodes.a[1];
		const old = target.data[0];
		const replacement = b.bigGeometry(40, nodes.materialA);
		target.removeData(old);
		target.addData(replacement);
		target.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		const mesh = target.data[0].convertedObject[perf.viewport.id];
		const batch = mesh.userData.batchedMesh;
		const range = batch.getGeometryRangeAt(
			batch.getGeometryIdAt(mesh.userData.batchId),
		);
		return {
			batched: Boolean(batch),
			vertices: range.vertexCount,
			indices: range.indexCount,
			instances: batch.instanceCount,
			bBatchSame: before.includes(
				nodes.b[0].data[0].convertedObject[perf.viewport.id].userData
					.batchedMesh,
			),
			singles: b.visibleMeshes(),
		};
	});

	expect(result.batched).toBe(true);
	expect(result.vertices).toBe(120);
	expect(result.indices).toBe(120);
	expect(result.instances).toBe(5);
	expect(result.bBatchSame).toBe(true);
	expect(result.singles).toBe(0);
});

test("SS-10477 a removed member leaves its batch and nothing else changes", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		const errors: string[] = [];
		window.addEventListener("error", (event) => errors.push(event.message));
		await perf.create({shadows: false});
		const nodes = b.twoBatches(6);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const before = b.batches();
		const batchOfB =
			nodes.b[0].data[0].convertedObject[perf.viewport.id].userData
				.batchedMesh;
		SDV.sceneTree.root.removeChild(nodes.a[2]);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		const batchOfA =
			nodes.a[0].data[0].convertedObject[perf.viewport.id].userData
				.batchedMesh;
		return {
			errors,
			sameBatches: before.every((x: any) => b.batches().includes(x)),
			instancesA: batchOfA.instanceCount,
			instancesB: batchOfB.instanceCount,
		};
	});

	expect(result.errors).toEqual([]);
	expect(result.sameBatches).toBe(true);
	expect(result.instancesA).toBe(5);
	expect(result.instancesB).toBe(6);
});

test("SS-10477 a batch that shrinks to one member is a mesh again", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(3);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const start = {batches: b.batches().length, singles: b.visibleMeshes()};
		SDV.sceneTree.root.removeChild(nodes.a[0]);
		SDV.sceneTree.root.removeChild(nodes.a[1]);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		// One box of material A is left: one draw already, so it stays a mesh.
		const shrunk = {
			batches: b.batches().length,
			singles: b.visibleMeshes(),
		};
		const geometry = perf.boxGeometry([0, 10, 0], [0.8, 10.8, 0.8]);
		geometry.material = nodes.materialA;
		const node = new SDV.TreeNode("again");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		// A second one with its key: both are a batch again.
		const joined = {
			batches: b.batches().length,
			singles: b.visibleMeshes(),
		};
		return {start, shrunk, joined};
	});

	expect(result.start).toEqual({batches: 2, singles: 0});
	expect(result.shrunk).toEqual({batches: 1, singles: 1});
	expect(result.joined).toEqual({batches: 2, singles: 0});
});

test("SS-10477 a mirrored member leaves its batch and comes back", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(6);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const before = b.batches();
		const target = nodes.a[2];
		const mesh = () => target.data[0].convertedObject[perf.viewport.id];
		const state = () => {
			const batch = mesh().userData.batchedMesh;
			return {
				meshVisible: mesh().visible,
				instanceVisible: batch
					? batch.getVisibleAt(mesh().userData.batchId)
					: null,
			};
		};
		const mirror = (x: number) => ({
			id: "mirror",
			matrix: new Float32Array([
				x,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
			]),
		});
		const start = state();
		const transformation = mirror(-1);
		target.addTransformation(transformation);
		target.updateVersion();
		perf.viewport.update();
		const mirrored = state();
		target.removeTransformation(transformation);
		target.updateVersion();
		perf.viewport.update();
		const restored = state();
		return {
			start,
			mirrored,
			restored,
			sameBatches: b.batches().every((x: any) => before.includes(x)),
			singles: b.visibleMeshes(),
		};
	});

	expect(result.start).toEqual({meshVisible: false, instanceVisible: true});
	// A mirrored mesh is drawn on its own: the batch would flip its winding.
	expect(result.mirrored.meshVisible).toBe(true);
	expect(result.mirrored.instanceVisible).not.toBe(true);
	expect(result.restored).toEqual({
		meshVisible: false,
		instanceVisible: true,
	});
	expect(result.sameBatches).toBe(true);
	expect(result.singles).toBe(0);
});

test("SS-10477 a standard update does not collect the sdTF overview", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const nodes = b.twoBatches(4);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		// `createSDTFOverview` collects the overview with `traverseData`.
		let proto = Object.getPrototypeOf(nodes.a[0]);
		while (proto && !Object.getOwnPropertyDescriptor(proto, "traverseData"))
			proto = Object.getPrototypeOf(proto);
		const original = proto.traverseData;
		let calls = 0;
		proto.traverseData = function (...args: any[]) {
			calls++;
			return original.apply(this, args);
		};
		try {
			nodes.a[1].visible = false;
			nodes.a[1].updateVersion();
			perf.viewport.update();
			const standard = calls;
			perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
			perf.viewport.update();
			return {standard, attributes: calls - standard};
		} finally {
			proto.traverseData = original;
		}
	});

	expect(result.standard).toBe(0);
	// The attribute visualization still reads it.
	expect(result.attributes).toBeGreaterThan(0);
});

test("SS-10477 switching the renderer type repeatedly leaves no batches behind", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		b.twoBatches(6);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const counts: number[] = [];
		const geometries: number[] = [];
		for (let i = 0; i < 10; i++) {
			perf.viewport.type =
				i % 2 === 0
					? SDV.RENDERER_TYPE.ATTRIBUTES
					: SDV.RENDERER_TYPE.STANDARD;
			perf.viewport.update();
			await perf.nextFrame();
			counts.push(b.batches().length);
		}
		await perf.nextFrame();
		geometries.push(perf.renderer.info.memory.geometries);
		return {
			counts,
			// 10 switches end in standard mode: both batches again
			final: b.batches().length,
			geometries,
		};
	});

	expect(result.final).toBe(2);
	// Never more batches than the two the scene has.
	for (const count of result.counts) expect(count).toBeLessThanOrEqual(2);
});

test("SS-10477 a change in one viewport updates both viewports", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBatchTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const b = (window as any).__b;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const canvas = document.createElement("canvas");
		canvas.width = 320;
		canvas.height = 240;
		document.body.appendChild(canvas);
		const second = await SDV.createViewport({
			canvas,
			id: "second",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});
		second.shadows = false;
		const nodes = b.twoBatches(6);
		perf.viewport.update();
		second.update();
		const first = perf.viewport;
		const visibleIn = (viewport: any, node: any) => {
			const mesh = node.data[0].convertedObject[viewport.id];
			return mesh.userData.batchedMesh.getVisibleAt(
				mesh.userData.batchId,
			);
		};
		const startFirst = b.batches(first);
		const startSecond = b.batches(second);
		const watcher = b.watch();
		nodes.a[2].visible = false;
		nodes.a[2].updateVersion();
		first.update();
		const afterFirstOnly = {
			first: visibleIn(first, nodes.a[2]),
			second: visibleIn(second, nodes.a[2]),
			matrixWrites: watcher.read().matrices,
		};
		second.update();
		return {
			afterFirstOnly,
			bothAfterUpdates: [
				visibleIn(first, nodes.a[2]),
				visibleIn(second, nodes.a[2]),
			],
			matrixWrites: watcher.read().matrices,
			neighbours: [
				visibleIn(first, nodes.a[3]),
				visibleIn(second, nodes.a[3]),
			],
			sameFirst: b
				.batches(first)
				.every((x: any) => startFirst.includes(x)),
			sameSecond: b
				.batches(second)
				.every((x: any) => startSecond.includes(x)),
		};
	});

	// Each viewport updates on its own schedule. The second has not seen the
	// change until it updates.
	expect(result.afterFirstOnly.first).toBe(false);
	expect(result.afterFirstOnly.second).toBe(true);
	expect(result.afterFirstOnly.matrixWrites).toBe(1);
	expect(result.bothAfterUpdates).toEqual([false, false]);
	// One member per viewport, the same as with one viewport.
	expect(result.matrixWrites).toBe(2);
	expect(result.neighbours).toEqual([true, true]);
	expect(result.sameFirst).toBe(true);
	expect(result.sameSecond).toBe(true);
});
