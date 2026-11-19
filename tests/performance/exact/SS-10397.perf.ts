import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10397 opaque batches skip the per-instance sort and cull", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const opaque = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const glass = new SDV.MaterialStandardData({
			color: "#88bbdd",
			opacity: 0.35,
			alphaMode: SDV.MATERIAL_ALPHA.BLEND,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		const add = (name: string, material: any, x: number, z: number) => {
			const geometry = perf.boxGeometry(
				[x - 0.4, -0.4, z],
				[x + 0.4, 0.4, z + 0.8],
			);
			geometry.material = material;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		};
		for (let i = 0; i < 4; i++) add(`opaque${i}`, opaque, 0, i * 1.2);
		for (let i = 0; i < 4; i++) add(`glass${i}`, glass, 1.2, i * 1.2);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		const batchOf = (name: string) =>
			SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === name,
			)?.data[0]?.convertedObject[perf.viewport.id]?.userData
				?.batchedMesh;
		const opaqueBatch = batchOf("opaque0");
		const glassBatch = batchOf("glass0");
		await perf.nextFrame();
		// Count the per-instance bounds reads three.js does while it
		// sorts or culls a batch.
		const reads = new Map<any, number>();
		for (const batch of [opaqueBatch, glassBatch]) {
			if (!batch) continue;
			reads.set(batch, 0);
			const original = batch.getBoundingSphereAt.bind(batch);
			batch.getBoundingSphereAt = (...args: any[]) => {
				reads.set(batch, (reads.get(batch) ?? 0) + 1);
				return original(...args);
			};
		}
		await perf.viewport.camera.set([3, 2, -3], [0.6, 0, 2], {duration: 0});
		perf.viewport.update();
		perf.renders.length = 0;
		await perf.nextFrame();
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles > 0,
		);
		// Hiding a member still drops it from an opaque batch.
		const hidden = SDV.sceneTree.root.children.find(
			(child: {name: string}) => child.name === "opaque0",
		);
		hidden.visible = false;
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.renders.length = 0;
		await perf.nextFrame();
		const hiddenPass = perf.renders.find(
			(item: any) => item.target === null && item.triangles > 0,
		);
		return {
			renderer: perf.renderer.sortObjects,
			opaque: opaqueBatch
				? {
						sort: opaqueBatch.sortObjects,
						cull: opaqueBatch.perObjectFrustumCulled,
						reads: reads.get(opaqueBatch),
					}
				: null,
			glass: glassBatch
				? {
						sort: glassBatch.sortObjects,
						cull: glassBatch.perObjectFrustumCulled,
						reads: reads.get(glassBatch),
					}
				: null,
			triangles: pass?.triangles ?? null,
			hiddenTriangles: hiddenPass?.triangles ?? null,
		};
	});
	expect(result.opaque, JSON.stringify(result)).toEqual({
		sort: false,
		cull: false,
		reads: 0,
	});
	expect(result.glass?.sort, JSON.stringify(result)).toBe(true);
	expect(result.glass?.cull, JSON.stringify(result)).toBe(true);
	expect(result.glass?.reads, JSON.stringify(result)).toBeGreaterThan(0);
	// Renderer-wide sorting stays off: most meshes are still individual
	// draws on large models.
	expect(result.renderer, JSON.stringify(result)).toBe(false);
	// Four opaque boxes (48 triangles) plus four glass boxes drawn back
	// faces, then front faces (2 x 48). Hiding one opaque box drops 12.
	expect(result.triangles, JSON.stringify(result)).toBe(144);
	expect(result.hiddenTriangles, JSON.stringify(result)).toBe(132);
});
