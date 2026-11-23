import {expect, type Page} from "@playwright/test";
import {open, test} from "./harness";

/** Creates a viewport with one box and draws a frame. */
const createViewport = (page: Page) =>
	page.evaluate(async () => {
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
	});

/** The drawing buffer after the next frame, and the cap of the viewport. */
const readSize = (page: Page) =>
	page.evaluate(async () => {
		const perf = (window as any).__perf;
		perf.viewport.update();
		await perf.nextFrame();
		const canvas = perf.renderer.domElement as HTMLCanvasElement;
		return {
			buffer: [canvas.width, canvas.height],
			maximum: perf.viewport.maximumRenderingSize,
		};
	});

test.describe("SS-10506 maximum rendering size in the viewer settings", () => {
	// 2560x1440 physical pixels: above the cap of 1920x1080
	test.use({viewport: {width: 1280, height: 720}, deviceScaleFactor: 2});

	test("settings without a maximum rendering size keep the size", async ({
		page,
	}) => {
		await open(page);
		await createViewport(page);
		expect(await readSize(page)).toEqual({
			buffer: [1920, 1080],
			maximum: {width: 1920, height: 1080},
		});

		// settings saved before 7.2 do not have the two values
		await page.evaluate(async () => {
			const viewport = (window as any).__perf.viewport;
			const settings = viewport.getViewportSettings();
			delete settings.rendering.maximumRenderingSize;
			delete settings.rendering.maximumRenderingSizeMobile;
			// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2
			settings.settings_version = "7.1";
			await viewport.applyViewportSettings(settings, {scene: true});
		});
		expect(await readSize(page)).toEqual({
			buffer: [1920, 1080],
			maximum: {width: 1920, height: 1080},
		});

		// a value set through the API also stays
		await page.evaluate(async () => {
			const viewport = (window as any).__perf.viewport;
			const settings = viewport.getViewportSettings();
			delete settings.rendering.maximumRenderingSize;
			delete settings.rendering.maximumRenderingSizeMobile;
			viewport.maximumRenderingSize = {width: 2200, height: 1300};
			// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2
			settings.settings_version = "7.1";
			await viewport.applyViewportSettings(settings, {scene: true});
		});
		expect((await readSize(page)).maximum).toEqual({
			width: 2200,
			height: 1300,
		});
	});

	test("the default settings raise the desktop size, high performance does not", async ({
		page,
	}) => {
		await open(page);
		await createViewport(page);
		const applyPreset = (preset: string) =>
			page.evaluate(async (preset) => {
				const SDV = (window as any).SDV;
				const settings = SDV.defaultSettings[preset]();
				// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2,
				// the pinned version only validates up to 7.1 and keeps the 7.2 fields.
				settings.settings_version = "7.1";
				await (window as any).__perf.viewport.applyViewportSettings(
					settings,
					{scene: true},
				);
			}, preset);

		await applyPreset("default");
		expect(await readSize(page)).toEqual({
			buffer: [2560, 1440],
			maximum: {width: 2560, height: 1440},
		});

		await applyPreset("highPerformance");
		expect(await readSize(page)).toEqual({
			buffer: [1920, 1080],
			maximum: {width: 1920, height: 1080},
		});
	});

	test("the settings store and apply the maximum rendering size", async ({
		page,
	}) => {
		await open(page);
		await createViewport(page);

		const saved = await page.evaluate(() => {
			const rendering = (
				window as any
			).__perf.viewport.getViewportSettings().rendering;
			return [
				rendering.maximumRenderingSize,
				rendering.maximumRenderingSizeMobile,
			];
		});
		expect(saved).toEqual([
			{width: 1920, height: 1080},
			{width: 1280, height: 720},
		]);

		// the desktop value applies here, the mobile value does not
		await page.evaluate(async () => {
			const viewport = (window as any).__perf.viewport;
			const settings = viewport.getViewportSettings();
			settings.rendering.maximumRenderingSize = {
				width: 3840,
				height: 2160,
			};
			settings.rendering.maximumRenderingSizeMobile = {
				width: 640,
				height: 360,
			};
			// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2
			settings.settings_version = "7.1";
			await viewport.applyViewportSettings(settings, {scene: true});
		});
		expect(await readSize(page)).toEqual({
			buffer: [2560, 1440],
			maximum: {width: 3840, height: 2160},
		});

		// saving keeps the value of the other device kind
		const savedAgain = await page.evaluate(() => {
			const rendering = (
				window as any
			).__perf.viewport.getViewportSettings().rendering;
			return [
				rendering.maximumRenderingSize,
				rendering.maximumRenderingSizeMobile,
			];
		});
		expect(savedAgain).toEqual([
			{width: 3840, height: 2160},
			{width: 640, height: 360},
		]);

		// an invalid value is ignored
		await page.evaluate(async () => {
			const viewport = (window as any).__perf.viewport;
			const settings = viewport.getViewportSettings();
			settings.rendering.maximumRenderingSize = {width: 0, height: 100};
			// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2
			settings.settings_version = "7.1";
			await viewport.applyViewportSettings(settings, {scene: true});
		});
		expect((await readSize(page)).maximum).toEqual({
			width: 3840,
			height: 2160,
		});
	});
});
