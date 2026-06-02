import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const ringTicket = sdeuc1.models["Ring"].ticket;
const name = "settings";

test.describe("Settings", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);
	});

	test(name, async ({page}) => {
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
		}, ringTicket);
		await expect(page).toHaveScreenshot(
			name + "/automaticColorAdjustmentFalse.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].automaticColorAdjustment = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(
			name + "/automaticColorAdjustmentTrue.png",
		);
	});
});
