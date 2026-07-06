import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const name = "viewer_closing";

test.describe("Viewer Management", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"test-cdn/index.html",
		);
	});

	test("scenario 1", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/1_1.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.viewports["myViewer"].close();
		});
		await expect(page).toHaveScreenshot(name + "/1_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/1_3.png");
	});

	test("scenario 2", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/2_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.viewports["myViewer"].close();
		});
		await expect(page).toHaveScreenshot(name + "/2_3.png");
	});
});
