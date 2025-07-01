import {afterAll, beforeAll, describe, test} from "@jest/globals";
import webdriver from "selenium-webdriver";

import {sdeuc1} from "../../general/src/models";
import {createDriver, screenshotCompare} from "../../general/src/setup";

import * as ShapeDiverViewer from "@shapediver/viewer";

require("chromedriver");

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const materialPresetsTicket = sdeuc1.models["Material Presets"].ticket;

let driver: webdriver.WebDriver;
const name = "api_tests";

describe("device testing", () => {
	beforeAll(async () => {
		driver = await createDriver();
	});

	beforeEach(async () => {
		await driver
			.navigate()
			.to("https://viewer.shapediver.com/v3/latest/test-cdn/index.html");
	});

	afterAll(async () => {
		await driver.close();
		await driver.quit();
	});

	test(name + "_envMapBlur", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});

			const promises = [
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
						(e) => {
							const taskEvent = e as any;
							if (
								taskEvent.type ===
								(<any>window).SDV.TASK_TYPE
									.ENVIRONMENT_MAP_LOADING
							)
								resolve();
						},
					);
				}),
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
			];

			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			viewer.environmentMap = SDV.ENVIRONMENT_MAP.VENICE_SUNSET;
			viewer.environmentMapAsBackground = true;

			await Promise.all(promises);
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapBlurDefault",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapBlurriness = 0.2;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapBlur_02",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapBlurriness = 1;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapBlur_1",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapBlurriness = 0;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapBlur_0",
		);
	});

	test(name + "_envMapIntensity", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});

			const promises = [
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
						(e) => {
							const taskEvent = e as any;
							if (
								taskEvent.type ===
								(<any>window).SDV.TASK_TYPE
									.ENVIRONMENT_MAP_LOADING
							)
								resolve();
						},
					);
				}),
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
			];

			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			viewer.environmentMap = SDV.ENVIRONMENT_MAP.VENICE_SUNSET;
			viewer.environmentMapAsBackground = true;

			await Promise.all(promises);
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapIntensityDefault",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapIntensity = 0;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapIntensity_0",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapIntensity = 5;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapIntensity_5",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapIntensity = 1;

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapIntensity_1",
		);
	});

	test(name + "_envMapRotationHDR", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});

			await new Promise<void>((resolve) => setTimeout(resolve, 1000));

			const promises = [
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
						(e) => {
							const taskEvent = e as ShapeDiverViewer.ITaskEvent;
							if (
								taskEvent.type ===
								(<any>window).SDV.TASK_TYPE
									.ENVIRONMENT_MAP_LOADING
							)
								resolve();
						},
					);
				}),
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
			];

			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			viewer.environmentMap = SDV.ENVIRONMENT_MAP.PHOTO_STUDIO;
			viewer.environmentMapAsBackground = true;

			await Promise.all(promises);
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			cb();
		}, materialPresetsTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_Default",
		);

		await new Promise<void>((resolve) => setTimeout(resolve, 1000));
		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, -1, 0, 0];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_-PI",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [
				0, -0.7071067690849304, 0, 0.7071067690849304,
			];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_-PIhalf",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, 0, 0, 1];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_0",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [
				0, 0.7071067690849304, 0, 0.7071067690849304,
			];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_PIhalf",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, 1, 0, 0];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationHDR_PI",
		);
	});

	test(name + "_envMapRotationLDR", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});

			const promises = [
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.TASK.TASK_END,
						(e) => {
							const taskEvent = e as any;
							if (
								taskEvent.type ===
								(<any>window).SDV.TASK_TYPE
									.ENVIRONMENT_MAP_LOADING
							)
								resolve();
						},
					);
				}),
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
			];

			viewer.groundPlaneVisibility = false;
			viewer.gridVisibility = false;
			viewer.environmentMap = SDV.ENVIRONMENT_MAP_CUBE.PIAZZA_SAN_MARCO;
			viewer.environmentMapAsBackground = true;

			await Promise.all(promises);
			cb();
		}, materialPresetsTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_Default",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, -1, 0, 0];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_-PI",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [
				0, -0.7071067690849304, 0, 0.7071067690849304,
			];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_-PIhalf",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, 0, 0, 1];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_0",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [
				0, 0.7071067690849304, 0, 0.7071067690849304,
			];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_PIhalf",
		);

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewer"]!;

			viewport.environmentMapRotation = [0, 1, 0, 0];

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/envMapRotationLDR_PI",
		);
	});
});
