import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const name = "camera";

test.describe("Camera", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);
	});

	test("positioning", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/positioning.png");
	});

	test("set", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/set_1.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 100, 100], [-100, -100, -100], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(100);
		expect(r2.position[2]).toBeCloseTo(100);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(-100);
		expect(r2.target[2]).toBeCloseTo(-100);
		await expect(page).toHaveScreenshot(name + "/set_2.png");
	});

	test("reset", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/reset_1.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 100, 100], [-100, -100, -100], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(100);
		expect(r2.position[2]).toBeCloseTo(100);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(-100);
		expect(r2.target[2]).toBeCloseTo(-100);
		await expect(page).toHaveScreenshot(name + "/reset_2.png");

		const r3: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.reset({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r.defaultPosition[0]).toBeCloseTo(r3.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r3.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r3.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r3.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r3.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r3.target[2]);
		await expect(page).toHaveScreenshot(name + "/reset_3.png");
	});

	test("zoomTo", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/zoom_1.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 0, 0], [-100, 0, 0], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(0);
		expect(r2.position[2]).toBeCloseTo(0);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(0);
		expect(r2.target[2]).toBeCloseTo(0);
		await expect(page).toHaveScreenshot(name + "/zoom_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.zoomTo();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/zoom_3.png");
	});

	test("ortho_switch", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			const camera = viewer.createOrthographicCamera(
				"myOrthographicCamera",
			);
			camera.direction = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
			viewer.assignCamera(camera.id);
			viewer.update();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");
	});

	test("ortho_set", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			const camera = viewer.createOrthographicCamera(
				"myOrthographicCamera",
			);
			camera.direction = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
			viewer.assignCamera(camera.id);
			viewer.update();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 100, 100], [-100, -100, -100], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(100);
		expect(r2.position[2]).toBeCloseTo(100);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(-100);
		expect(r2.target[2]).toBeCloseTo(-100);
		await expect(page).toHaveScreenshot(name + "/ortho_set.png");
	});

	test("ortho_reset", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			const camera = viewer.createOrthographicCamera(
				"myOrthographicCamera",
			);
			camera.direction = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
			viewer.assignCamera(camera.id);
			viewer.update();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 100, 100], [-100, -100, -100], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(100);
		expect(r2.position[2]).toBeCloseTo(100);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(-100);
		expect(r2.target[2]).toBeCloseTo(-100);
		await expect(page).toHaveScreenshot(name + "/ortho_reset.png");

		const r3: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.reset({});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r.defaultPosition[0]).toBeCloseTo(r3.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r3.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r3.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r3.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r3.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r3.target[2]);
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");
	});

	test("ortho_zoomTo", async ({page}) => {
		const r: any = await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			const camera = viewer.createOrthographicCamera(
				"myOrthographicCamera",
			);
			camera.direction = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
			viewer.assignCamera(camera.id);
			viewer.update();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				defaultPosition: viewer.camera!.defaultPosition,
				defaultTarget: viewer.camera!.defaultTarget,
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		}, shelfTicket);
		expect(r.defaultPosition[0]).toBeCloseTo(r.position[0]);
		expect(r.defaultPosition[1]).toBeCloseTo(r.position[1]);
		expect(r.defaultPosition[2]).toBeCloseTo(r.position[2]);
		expect(r.defaultTarget[0]).toBeCloseTo(r.target[0]);
		expect(r.defaultTarget[1]).toBeCloseTo(r.target[1]);
		expect(r.defaultTarget[2]).toBeCloseTo(r.target[2]);
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");

		const r2: any = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.set([100, 0, 0], [-100, 0, 0], {});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return {
				position: viewer.camera!.position,
				target: viewer.camera!.target,
			};
		});
		expect(r2.position[0]).toBeCloseTo(100);
		expect(r2.position[1]).toBeCloseTo(0);
		expect(r2.position[2]).toBeCloseTo(0);
		expect(r2.target[0]).toBeCloseTo(-100);
		expect(r2.target[1]).toBeCloseTo(0);
		expect(r2.target[2]).toBeCloseTo(0);
		await expect(page).toHaveScreenshot(name + "/ortho_zoom.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewer = SDV.viewports["myViewer"]!;
			await viewer.camera!.zoomTo();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/ortho_positioning.png");
	});
});
