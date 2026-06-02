import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const materialPresetsTicket = sdeuc1.models["Material Presets"].ticket;
const name = "lights";

test.describe("Lights", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);
	});

	test("default", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/default.png");
	});

	test("addAmbientLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lightScene!.addAmbientLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/addAmbientLight.png");
	});

	test("addDirectionalLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lightScene!.addDirectionalLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/addDirectionalLight.png");
	});

	test("addHemisphereLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lightScene!.addHemisphereLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/addHemisphereLight.png");
	});

	test("addPointLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lightScene!.addPointLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/addPointLight.png");
	});

	test("addSpotLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lightScene!.addSpotLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/addSpotLight.png");
	});

	test("soloAmbientLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.createLightScene();
			viewer.removeLightScene("default");
			viewer.lightScene!.addAmbientLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/soloAmbientLight.png");
	});

	test("soloDirectionalLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.createLightScene();
			viewer.removeLightScene("default");
			viewer.lightScene!.addDirectionalLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/soloDirectionalLight.png");
	});

	test("soloHemisphereLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.createLightScene();
			viewer.removeLightScene("default");
			viewer.lightScene!.addHemisphereLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/soloHemisphereLight.png");
	});

	test("soloPointLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.createLightScene();
			viewer.removeLightScene("default");
			viewer.lightScene!.addPointLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/soloPointLight.png");
	});

	test("soloSpotLight", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.createLightScene();
			viewer.removeLightScene("default");
			viewer.lightScene!.addSpotLight({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/soloSpotLight.png");
	});

	test("disable", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/default.png");

		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			viewer.lights = false;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/disabled.png");
	});

	test("envMap_NONE", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lights = false;
			const taskP = new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
					(e) => {
						const taskEvent = e as any;
						if (
							taskEvent.type ===
							(<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING
						)
							resolve();
					},
				);
			});
			const renderingP = new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
				setTimeout(resolve, 3000);
			});
			viewer.environmentMap = "none";
			await taskP;
			await renderingP;
		}, materialPresetsTicket);
		await expect(page).toHaveScreenshot(name + "/envMap_none.png");
	});

	test("envMap_NULL", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			viewer.beautyRenderDelay = 100;
			viewer.beautyRenderBlendingDuration = 100;
			viewer.lights = false;
			const taskP = new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
					(e) => {
						const taskEvent = e as any;
						if (
							taskEvent.type ===
							(<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING
						)
							resolve();
					},
				);
			});
			const renderingP = new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
				setTimeout(resolve, 3000);
			});
			viewer.environmentMap = "null";
			await taskP;
			await renderingP;
		}, materialPresetsTicket);
		await expect(page).toHaveScreenshot(name + "/envMap_null.png");
	});
});
