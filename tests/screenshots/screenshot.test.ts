import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1, sdr7euc1} from "../models.json";

const name = "screenshots";

test.describe("Screenshots", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto(
			"test-cdn/index.html",
		);
	});

	for (const modelDescription of [sdeuc1, sdr7euc1]) {
		for (const model in modelDescription.models) {
			const modelTicket = modelDescription.models[model].ticket;
			const backend = modelDescription.backend;
			const testName = modelDescription.name + "_" + model;

			test(testName, async ({page}) => {
				await page.evaluate(
					async ({
						ticket,
						modelViewUrl,
					}: {
						ticket: string;
						modelViewUrl: string;
					}) => {
						const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
						const viewer = await SDV.createViewport({
							id: "myViewer",
							canvas: <HTMLCanvasElement>(
								document.getElementById("canvas")
							),
						});
						await SDV.createSession({ticket, modelViewUrl});
						viewer.beautyRenderDelay = 100;
						viewer.beautyRenderBlendingDuration = 100;
						await new Promise<void>((resolve) => {
							SDV.addListener(
								SDV.EVENTTYPE.RENDERING
									.BEAUTY_RENDERING_FINISHED,
								async () => resolve(),
							);
						});
					},
					{ticket: modelTicket, modelViewUrl: backend},
				);
				await expect(page).toHaveScreenshot(
					name + "/" + modelDescription.name + "/" + model + ".png",
				);
			});
		}
	}
});
