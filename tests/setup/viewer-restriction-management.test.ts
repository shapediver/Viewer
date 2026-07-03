import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const ringTicket = sdeuc1.models["Ring"].ticket;
const name = "viewer_restriction";

test.describe("Viewer Restriction", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"/test-cdn/index.html",
		);
	});

	test("exclude viewports", async ({page}) => {
		await page.evaluate(
			async ({ticket, ticket2}: {ticket: string; ticket2: string}) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				const viewer = await SDV.createViewport({
					branding: {
						logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
					},
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
				});
				await SDV.createSession({
					id: "mySession1",
					ticket: ticket2,
					modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
					excludeViewports: ["myViewer"],
				});
				await SDV.createSession({
					id: "mySession2",
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
			},
			{ticket: shelfTicket, ticket2: ringTicket},
		);
		await expect(page).toHaveScreenshot(name + "/test_1.png");
	});
});
