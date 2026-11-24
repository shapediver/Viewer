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
});
