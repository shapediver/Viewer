import {expect, type Page} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

/**
 * A white unlit box on black, seen at an angle so its silhouette edges are
 * slanted. Returns the number of distinct red values in the settled
 * screenshot and the number of canvas draws until the fade finished.
 * Averaging jittered frames gives the edges many more grey levels than the
 * multisampled canvas alone.
 */
const settle = async (
	page: Page,
	accumulationFrames: number | undefined,
	moveCameraAfterwards = false,
) =>
	page.evaluate(
		async ({accumulationFrames, moveCameraAfterwards}) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({softShadows: false, beautyDuration: 0});
			const viewport = perf.viewport;
			if (accumulationFrames !== undefined)
				viewport.accumulationFrames = accumulationFrames;
			viewport.clearColor = "#000000";
			const geometry = perf.boxGeometry([-1, -1, -1], [1, 1, 1]);
			geometry.material = new SDV.MaterialUnlitData({color: "#ffffff"});
			const node = new SDV.TreeNode("box");
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
			SDV.sceneTree.root.updateVersion();

			let finished = 0;
			let resolveFinished = () => {};
			SDV.addListener(
				SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
				() => {
					finished++;
					resolveFinished();
				},
			);
			const waitForFinished = () =>
				new Promise<void>((resolve) => {
					resolveFinished = resolve;
					setTimeout(resolve, 10000);
				});

			let wait = waitForFinished();
			viewport.update();
			viewport.show = true;
			await viewport.camera.set([3.1, 1.7, 6.3], [0, 0, 0], {
				duration: 0,
			});
			perf.renders.length = 0;
			await wait;
			const canvasDraws = perf.renders.filter(
				(r: any) => r.target === null,
			).length;

			if (moveCameraAfterwards) {
				wait = waitForFinished();
				await viewport.camera.set([3.3, 1.5, 6.2], [0, 0, 0], {
					duration: 0,
				});
				await wait;
			}

			const url = viewport.getScreenshot();
			const bitmap = await createImageBitmap(
				await (await fetch(url)).blob(),
			);
			const canvas = document.createElement("canvas");
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const context = canvas.getContext("2d")!;
			context.drawImage(bitmap, 0, 0);
			const data = context.getImageData(
				0,
				0,
				bitmap.width,
				bitmap.height,
			).data;
			const levels = new Set<number>();
			for (let i = 0; i < data.length; i += 4) levels.add(data[i]);
			return {levels: levels.size, canvasDraws, finished};
		},
		{accumulationFrames, moveCameraAfterwards},
	);

test.describe("SS-10508 accumulate jittered frames while the camera is still", () => {
	test.beforeEach(async ({page}) => {
		await skipOnSoftwareRenderer(
			page,
			"the accumulation runs in the soft-shadow fade, off on SwiftShader",
		);
		await open(page);
	});

	test("off by default: the edges keep the multisampled look", async ({
		page,
	}) => {
		const result = await settle(page, undefined);
		expect(result.finished).toBe(1);
		// 4x MSAA gives a handful of edge levels, nothing in between
		expect(result.levels).toBeLessThanOrEqual(8);
	});

	test("16 frames smooth the edges and end the fade once", async ({page}) => {
		const result = await settle(page, 16);
		expect(result.finished).toBe(1);
		expect(result.levels).toBeGreaterThan(20);
		// the fade of 0 ms waits for the frames: 16 scene draws, 15 means
		expect(result.canvasDraws).toBeGreaterThanOrEqual(16);
	});

	test("a camera change starts a new mean", async ({page}) => {
		const result = await settle(page, 16, true);
		expect(result.finished).toBe(2);
		expect(result.levels).toBeGreaterThan(20);
	});
});
