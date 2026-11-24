import {expect, type Page, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdr7euc1} from "../models.json";

const shelfTicket = sdr7euc1.models["Shelf"].ticket;

/**
 * Runs the change in the page and waits until the beauty rendering after it
 * has finished. The listener is added before the change, so it cannot be missed.
 */
const changeAndSettle = (page: Page, change: string, arg?: string) =>
	page.evaluate(
		async ({change, arg}) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const finished = new Promise<void>((resolve) => {
				const token = SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						SDV.removeListener(token);
						resolve();
					},
				);
			});
			const result = await new Function(
				"SDV",
				"arg",
				`return (async () => { ${change} })();`,
			)(SDV, arg);
			await finished;
			return result as string | undefined;
		},
		{change, arg},
	);

/** The color of one background pixel of a PNG screenshot. */
const backgroundPixel = (image: Buffer, page: Page) =>
	page.evaluate(async (data: string) => {
		const img = new Image();
		img.src = "data:image/png;base64," + data;
		await img.decode();
		const canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		const context = canvas.getContext("2d")!;
		context.drawImage(img, 0, 0);
		return Array.from(context.getImageData(5, 5, 1, 1).data);
	}, image.toString("base64"));

test.describe("Screen space reflections", () => {
	test("ssr keeps the background and the old look", async ({page}) => {
		const glErrors: string[] = [];
		page.on("console", (message) => {
			if (/GL_INVALID|WebGL: INVALID/.test(message.text()))
				glErrors.push(message.text());
		});
		await page.goto("test-cdn/index.html");
		await changeAndSettle(
			page,
			`const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket: arg,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.clearColor = "#e4e4e4";
			viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
			viewport.postProcessing.hdr = true;
			// any effect turns on the post-processing, whose tone mapping
			// keeps the background out by its depth
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
				properties: {darkness: 0},
			});`,
			shelfTicket,
		);
		const off = await page.locator("#canvas").screenshot();

		const token = await changeAndSettle(
			page,
			`return SDV.viewports["myViewport"].postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSR,
				properties: {intensity: 1},
			});`,
		);
		const on = await page.locator("#canvas").screenshot();
		const types = await page.evaluate(() => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			return SDV.viewports["myViewport"].postProcessing
				.getPostProcessingEffectsArray()
				.map((e) => e.type);
		});
		expect(types).toContain("ssr");

		await changeAndSettle(
			page,
			"SDV.viewports.myViewport.postProcessing.removeEffect(arg);",
			token,
		);
		const offAgain = await page.locator("#canvas").screenshot();

		// the background is not shaded, so the reflections must not change it
		expect(await backgroundPixel(on, page)).toEqual(
			await backgroundPixel(off, page),
		);
		// without the effect the image is the one before it was added
		expect(offAgain.equals(off)).toBe(true);
		expect(glErrors).toEqual([]);
	});

	test("a screenshot right after adding ssr or a resize has reflections", async ({
		page,
	}) => {
		await page.goto("test-cdn/index.html");
		await changeAndSettle(
			page,
			`const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket: arg,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			// a screenshot then draws a new frame instead of the accumulated one
			viewport.accumulationFrames = 0;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
				properties: {darkness: 0},
			});`,
			shelfTicket,
		);

		// The reflections read the previous frame. A single frame drawn for a
		// screenshot has to have one, even when the effect has none yet.
		const result = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewport"];
			const token = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSR,
			});
			const effect = viewport.postProcessing.getEffect(
				token,
			) as unknown as {
				lastFrameValid: boolean;
			};
			viewport.getScreenshot();
			const afterAdd = effect.lastFrameValid;

			const size = async (dataUrl: string) => {
				const img = new Image();
				img.src = dataUrl;
				await img.decode();
				return [img.width, img.height];
			};
			const before = await size(viewport.getScreenshot());
			// the viewport takes its size from the parent of the canvas
			const parent = document.getElementById("canvas")!.parentElement!;
			parent.style.width = `${Math.round(parent.clientWidth / 2)}px`;
			const resized = viewport.getScreenshot();
			const afterResize = effect.lastFrameValid;
			return {afterAdd, afterResize, before, after: await size(resized)};
		});
		expect(result.afterAdd).toBe(true);
		// the resize changed the drawing buffer, so the effect had to start over
		expect(result.after).not.toEqual(result.before);
		expect(result.afterResize).toBe(true);
	});
});
