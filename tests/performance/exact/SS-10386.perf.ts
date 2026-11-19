import {expect} from "@playwright/test";
import {open, test} from "./harness";

test.describe("SS-10386 drawing buffer is capped in physical pixels", () => {
	test.use({viewport: {width: 1280, height: 720}, deviceScaleFactor: 2});

	test("1280x720 at device pixel ratio 2 stays inside 1920x1080", async ({
		page,
	}) => {
		await open(page);
		const size = await page.evaluate(async () => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			perf.addBoxes(
				1,
				new SDV.MaterialStandardData({
					color: "#888888",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			);
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.nextFrame();
			const canvas = perf.renderer.domElement as HTMLCanvasElement;
			const cssWidth = canvas.parentElement!.clientWidth;
			const cssHeight = canvas.parentElement!.clientHeight;
			const ratio = window.devicePixelRatio;
			const maxWidth = 1920;
			const maxHeight = 1080;
			let width = cssWidth * ratio;
			let height = cssHeight * ratio;
			if (width > maxWidth || height > maxHeight) {
				const aspect = cssWidth / cssHeight;
				if ((width - maxWidth) / aspect > height - maxHeight) {
					width = maxWidth;
					height = maxWidth / aspect;
				} else {
					height = maxHeight;
					width = maxHeight * aspect;
				}
			}
			return {
				buffer: [canvas.width, canvas.height],
				expected: [Math.floor(width), Math.floor(height)],
				css: [cssWidth, cssHeight],
				ratio,
			};
		});
		expect(size.ratio).toBe(2);
		expect(size.css).toEqual([1280, 720]);
		expect(size.buffer).toEqual(size.expected);
		expect(size.buffer).toEqual([1920, 1080]);
	});
});

test.describe("SS-10386 device pixel ratio 1 is unchanged", () => {
	test.use({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});

	test("800x600 stays 800x600", async ({page}) => {
		await open(page);
		const size = await page.evaluate(async () => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			perf.addBoxes(
				1,
				new SDV.MaterialStandardData({
					color: "#888888",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			);
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.nextFrame();
			const canvas = perf.renderer.domElement as HTMLCanvasElement;
			return {
				buffer: [canvas.width, canvas.height],
				css: [
					canvas.parentElement!.clientWidth,
					canvas.parentElement!.clientHeight,
				],
			};
		});
		expect(size.css).toEqual([800, 600]);
		expect(size.buffer).toEqual([800, 600]);
	});
});
