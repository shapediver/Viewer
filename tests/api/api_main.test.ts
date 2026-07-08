import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const materialPresetsTicket = sdeuc1.models["Material Presets"].ticket;
const name = "api";

test.describe("API", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"test-cdn/index.html",
		);
	});

	test("envMapBlur", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
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
			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			await new Promise<void>((resolve) => {
				let done = false;
				const finish = () => {
					if (done) return;
					done = true;
					resolve();
				};
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => finish(),
				);
				viewer.environmentMap = SDV.ENVIRONMENT_MAP.VENICE_SUNSET;
				viewer.environmentMapAsBackground = true;
				setTimeout(() => finish(), 3000);
			});
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/envMapBlurDefault.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				viewport.environmentMapBlurriness = 0.2;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapBlur_02.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				viewport.environmentMapBlurriness = 1;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapBlur_1.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				viewport.environmentMapBlurriness = 0;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapBlur_0.png");
	});

	test("envMapIntensity", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
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
			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			await new Promise<void>((resolve) => {
				let done = false;
				const finish = () => {
					if (done) return;
					done = true;
					resolve();
				};
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => finish(),
				);
				viewer.environmentMap = SDV.ENVIRONMENT_MAP.VENICE_SUNSET;
				viewer.environmentMapAsBackground = true;
				setTimeout(() => finish(), 3000);
			});
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
		}, shelfTicket);
		await expect(page).toHaveScreenshot(
			name + "/envMapIntensityDefault.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapIntensity = 0;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapIntensity_0.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapIntensity = 5;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapIntensity_5.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapIntensity = 1;
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapIntensity_1.png");
	});

	test("envMapRotationHDR", async ({page}) => {
		test.setTimeout(180_000);
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
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
			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
					(e: any) => {
						if (
							e.type ===
							(<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING
						)
							resolve();
					},
				);
				viewer.environmentMap = SDV.ENVIRONMENT_MAP.PHOTO_STUDIO;
				viewer.environmentMapAsBackground = true;
				setTimeout(resolve, 30000);
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
				SDV.viewports["myViewer"]!.render();
				setTimeout(resolve, 30000);
			});
		}, materialPresetsTicket);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationHDR_Default.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapRotation = [
					0, -1, 0, 0,
				];
			});
		});
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationHDR_-PI.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapRotation = [
					0, -0.7071067690849304, 0, 0.7071067690849304,
				];
			});
		});
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationHDR_-PIhalf.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapRotation = [
					0, 0, 0, 1,
				];
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapRotationHDR_0.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapRotation = [
					0, 0.7071067690849304, 0, 0.7071067690849304,
				];
			});
		});
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationHDR_PIhalf.png",
		);

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.environmentMapRotation = [
					0, 1, 0, 0,
				];
			});
		});
		await expect(page).toHaveScreenshot(name + "/envMapRotationHDR_PI.png");
	});

	test("envMapRotationLDR", async ({page}) => {
		test.setTimeout(360_000);
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
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
			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
					(e: any) => {
						if (
							e.type ===
							(<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING
						)
							resolve();
					},
				);
				viewer.environmentMap =
					SDV.ENVIRONMENT_MAP_CUBE.PIAZZA_SAN_MARCO;
				viewer.environmentMapAsBackground = true;
				setTimeout(resolve, 30000);
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
				SDV.viewports["myViewer"]!.render();
				setTimeout(resolve, 30000);
			});
		}, materialPresetsTicket);
		const screenshotOptions = {animations: "allow" as const, timeout: 60_000};
		const setEnvironmentMapRotation = async (rotation: number[]) => {
			await page.evaluate(async (rotation: number[]) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				const viewport = SDV.viewports["myViewer"]!;
				await new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						() => resolve(),
					);
					viewport.environmentMapRotation = rotation;
					viewport.render();
					setTimeout(resolve, 15000);
				});
			}, rotation);
		};

		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_Default.png",
			screenshotOptions,
		);

		await setEnvironmentMapRotation([0, -1, 0, 0]);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_-PI.png",
			screenshotOptions,
		);

		await setEnvironmentMapRotation([
			0, -0.7071067690849304, 0, 0.7071067690849304,
		]);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_-PIhalf.png",
			screenshotOptions,
		);

		await setEnvironmentMapRotation([0, 0, 0, 1]);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_0.png",
			screenshotOptions,
		);

		await setEnvironmentMapRotation([
			0, 0.7071067690849304, 0, 0.7071067690849304,
		]);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_PIhalf.png",
			screenshotOptions,
		);

		await setEnvironmentMapRotation([0, 1, 0, 0]);
		await expect(page).toHaveScreenshot(
			name + "/envMapRotationLDR_PI.png",
			screenshotOptions,
		);
	});
});
