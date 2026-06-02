import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const ringTicket = sdeuc1.models["Ring"].ticket;
const name = "session_closing";

test.describe("Session Management", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
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
			SDV.viewports["myViewer"].beautyRenderDelay = 100;
			SDV.viewports["myViewer"].beautyRenderBlendingDuration = 1;
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
			await SDV.sessions["mySession"].close();
		});
		await expect(page).toHaveScreenshot(name + "/1_2.png");

		await page.evaluate(async (ticket2: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.createSession({
				id: "mySession1",
				ticket: ticket2,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			SDV.viewports["myViewer"].beautyRenderDelay = 100;
			SDV.viewports["myViewer"].beautyRenderBlendingDuration = 1;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, ringTicket);
		await expect(page).toHaveScreenshot(name + "/1_3.png");
	});

	test("scenario 2", async ({page}) => {
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
				});
				await SDV.createSession({
					id: "mySession2",
					ticket,
					modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, ticket2: ringTicket},
		);
		await expect(page).toHaveScreenshot(name + "/2_1.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession1"].close();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/2_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession2"].close();
		});
		await expect(page).toHaveScreenshot(name + "/2_3.png");
	});

	test("scenario 3", async ({page}) => {
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
			SDV.viewports["myViewer"].beautyRenderDelay = 100;
			SDV.viewports["myViewer"].beautyRenderBlendingDuration = 1;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/3_1.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession"].close();
		});
		await expect(page).toHaveScreenshot(name + "/3_2.png");

		await page.evaluate(async (ticket2: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.createSession({
				id: "mySession1",
				ticket: ticket2,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			SDV.viewports["myViewer"].beautyRenderDelay = 100;
			SDV.viewports["myViewer"].beautyRenderBlendingDuration = 1;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, ringTicket);
		await expect(page).toHaveScreenshot(name + "/3_3.png");
	});

	test("scenario 4", async ({page}) => {
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
				});
				await SDV.createSession({
					id: "mySession2",
					ticket,
					modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, ticket2: ringTicket},
		);
		await expect(page).toHaveScreenshot(name + "/4_1.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession1"].close();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/4_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession2"].close();
		});
		await expect(page).toHaveScreenshot(name + "/4_3.png");
	});

	test("scenario 5", async ({page}) => {
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
				waitForOutputs: false,
				id: "mySession2",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			SDV.viewports["myViewer"].beautyRenderDelay = 100;
			SDV.viewports["myViewer"].beautyRenderBlendingDuration = 1;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/6_1.png");
	});
});
