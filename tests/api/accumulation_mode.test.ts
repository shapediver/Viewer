import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;

// SS-10607: where the accumulated frames are averaged
test.describe("Accumulation mode", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto("test-cdn/index.html");
	});

	test("defaults to display, is saved with the settings and rejects other values", async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const initial = viewport.accumulationMode;
			viewport.accumulationMode = "hdr";
			const saved = (
				viewport.getViewportSettings().rendering as {
					accumulationMode?: string;
				}
			).accumulationMode;
			let rejected = false;
			try {
				viewport.accumulationMode = <any>"canvas";
			} catch {
				rejected = true;
			}
			return {initial, saved, rejected, after: viewport.accumulationMode};
		});
		expect(result).toEqual({
			initial: "display",
			saved: "hdr",
			rejected: true,
			after: "hdr",
		});
	});

	test("hdr averages the frames of a model with HDR post-processing", async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		const result = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewport.postProcessing.hdr = true;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
				properties: {intensity: 0.2, luminanceThreshold: 2},
			});
			viewport.accumulationFrames = 8;
			viewport.accumulationMode = "hdr";
			viewport.update();
			const screenshot = await viewport.getSettledScreenshot();
			return {
				mode: viewport.accumulationMode,
				screenshot: screenshot.startsWith("data:image/png"),
			};
		}, shelfTicket);
		expect(result).toEqual({mode: "hdr", screenshot: true});
		expect(errors).toEqual([]);
	});
});
