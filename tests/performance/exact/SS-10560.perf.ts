import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10560: the batch key of a material does not encode its textures.
 * Building the key used to call `material.toJSON()` as a root call, which
 * writes every texture image to a data URL (`canvas.toDataURL`).
 *
 * The test loads boxes with textured materials and counts `toDataURL` calls.
 * It also checks that batching is unchanged: materials that share one texture
 * share a batch, a different texture gives another batch.
 * Counts only. Software-safe, shadows are off.
 */

test("SS-10560 building the batch keys does not encode texture images", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;

		/** An image without network. `toBlob` does not call `toDataURL`. */
		async function image(seed: number) {
			const canvas = document.createElement("canvas");
			canvas.width = 64;
			canvas.height = 64;
			const context = canvas.getContext("2d")!;
			for (let i = 0; i < 64; i += 8)
				for (let j = 0; j < 64; j += 8) {
					context.fillStyle = `rgb(${(i * 4 + seed) % 256}, ${(j * 4) % 256}, ${(seed * 40) % 256})`;
					context.fillRect(i, j, 8, 8);
				}
			const blob: Blob = await new Promise((resolve) =>
				canvas.toBlob((b) => resolve(b!)),
			);
			const element = new Image();
			const loaded = new Promise((resolve) => {
				element.onload = resolve;
			});
			element.src = URL.createObjectURL(blob);
			await loaded;
			return element;
		}

		// Created before the spy: building an image may call `toDataURL`.
		const mapA = new SDV.MapData(await image(1));
		const mapB = new SDV.MapData(await image(7));

		let toDataURL = 0;
		const original = HTMLCanvasElement.prototype.toDataURL;
		HTMLCanvasElement.prototype.toDataURL = function (...args: any[]) {
			toDataURL++;
			return original.apply(this, args as any);
		};
		let convertToBlob = 0;
		const originalBlob = (globalThis as any).OffscreenCanvas?.prototype
			?.convertToBlob;
		if (originalBlob)
			(globalThis as any).OffscreenCanvas.prototype.convertToBlob =
				function (...args: any[]) {
					convertToBlob++;
					return originalBlob.apply(this, args);
				};

		try {
			await perf.create({shadows: false});
			const colors = ["#ff6666", "#66ff66", "#6666ff", "#ffff66"];
			let index = 0;
			for (const map of [mapA, mapB])
				for (const color of colors) {
					// A separate material per box, one shared map per group.
					const material = new SDV.MaterialStandardData({
						color,
						map,
						side: SDV.MATERIAL_SIDE.FRONT,
					});
					const geometry = perf.boxGeometry(
						[index * 1.2, 0, 0],
						[index * 1.2 + 0.8, 0.8, 0.8],
					);
					geometry.material = material;
					const node = new SDV.TreeNode(`box${index}`);
					node.addData(geometry);
					SDV.sceneTree.root.addChild(node);
					index++;
				}
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.nextFrame();
		} finally {
			HTMLCanvasElement.prototype.toDataURL = original;
			if (originalBlob)
				(globalThis as any).OffscreenCanvas.prototype.convertToBlob =
					originalBlob;
		}

		const batches: any[] = [];
		perf.viewport.threeJsCoreObjects.scene.traverse((object: any) => {
			if (object.isBatchedMesh) batches.push(object);
		});
		return {toDataURL, convertToBlob, batches: batches.length};
	});

	expect(result.toDataURL).toBe(0);
	expect(result.convertToBlob).toBe(0);
	// One batch for the boxes with the first texture, one for the second.
	expect(result.batches).toBe(2);
});
