import {expect, type Page, test} from "@playwright/test";
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

	// SS-10656: in hdr the background is tone-mapped like the scene, stored
	// as the HDR colour that the tone mapping turns back into the clear colour.
	// The HDR value of the background is capped at 1.0, so colours lighter than
	// #e2e2e2 (what ACES makes of 1.0) show as #e2e2e2 in hdr.
	const cornerInBothModes = async (
		page: Page,
		displayColor: string,
		hdrColor: string,
	) => {
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		const result = await page.evaluate(
			async ([ticket, displayColor, hdrColor]: string[]) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				const viewport = await SDV.createViewport({
					id: "myViewport",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
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
				viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
				viewport.clearAlpha = 1;
				viewport.accumulationFrames = 8;

				// the colour of the top left pixel of a settled screenshot
				const corner = async () => {
					viewport.update();
					const image = new Image();
					image.src = await viewport.getSettledScreenshot();
					await image.decode();
					const canvas = document.createElement("canvas");
					canvas.width = image.width;
					canvas.height = image.height;
					const context = canvas.getContext("2d")!;
					context.drawImage(image, 0, 0);
					return [
						...context.getImageData(2, 2, 1, 1).data.slice(0, 3),
					];
				};
				viewport.clearColor = displayColor;
				viewport.accumulationMode = "display";
				const display = await corner();
				viewport.clearColor = hdrColor;
				viewport.accumulationMode = "hdr";
				const hdr = await corner();
				return {display, hdr};
			},
			[shelfTicket, displayColor, hdrColor],
		);
		expect(errors).toEqual([]);
		return result;
	};

	// the same background as without the HDR mean, where the tone mapping
	// leaves the clear colour untouched
	const expectSameCorner = (result: {display: number[]; hdr: number[]}) =>
		result.hdr.forEach((value, i) =>
			expect(
				Math.abs(value - result.display[i]),
				`channel ${i}: hdr ${value}, display ${result.display[i]}`,
			).toBeLessThanOrEqual(1),
		);

	for (const clearColor of ["#e2e2e2", "#336699"]) {
		test(`hdr shows the clear colour ${clearColor} as display does`, async ({
			page,
		}) => {
			expectSameCorner(
				await cornerInBothModes(page, clearColor, clearColor),
			);
		});
	}

	test("hdr caps a white background at 1.0", async ({page}) => {
		// #e2e2e2 is what ACES makes of 1.0
		expectSameCorner(await cornerInBothModes(page, "#e2e2e2", "#ffffff"));
	});
});
