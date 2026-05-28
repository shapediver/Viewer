import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const name = "creation_management";
const modelViewUrl = "https://sdeuc1.eu-central-1.shapediver.com";
const logo = "https://viewer.shapediver.com/v3/graphics/logo.png";

test.describe("Creation Management", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);
	});

	// ---- vs0: viewport first, standard session ----

	test("vs0_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_S_ss_F.png");
	});

	test("vs0_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_I_ss_F.png");
	});

	test("vs0_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_F_2.png");
	});

	test("vs0_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_S_ss_N.png");
	});

	test("vs0_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_I_ss_N.png");
	});

	test("vs0_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_N_2.png");
	});

	test("vs0_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_S_ss_M.png");
	});

	test("vs0_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_I_ss_M.png");
	});

	test("vs0_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs0_vis_M_ss_M_2.png");
	});

	// ---- vs1: viewport first, session with loadOutputs: false ----

	test("vs1_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_S_ss_F.png");
	});

	test("vs1_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_I_ss_F.png");
	});

	test("vs1_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_F_2.png");
	});

	test("vs1_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_S_ss_N.png");
	});

	test("vs1_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_I_ss_N.png");
	});

	test("vs1_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_N_2.png");
	});

	test("vs1_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_S_ss_M.png");
	});

	test("vs1_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_I_ss_M.png");
	});

	test("vs1_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/vs1_vis_M_ss_M_2.png");
	});

	// ---- vs2: viewport first, session with waitForOutputs: false ----

	test("vs2_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_S_ss_F.png");
	});

	test("vs2_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_I_ss_F.png");
	});

	test("vs2_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_F_2.png");
	});

	test("vs2_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_S_ss_N.png");
	});

	test("vs2_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_I_ss_N.png");
	});

	test("vs2_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_N_2.png");
	});

	test("vs2_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_S_ss_M.png");
	});

	test("vs2_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_I_ss_M.png");
	});

	test("vs2_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/vs2_vis_M_ss_M_2.png");
	});

	// ---- sv0: session first, standard ----

	test("sv0_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_S_ss_F.png");
	});

	test("sv0_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_I_ss_F.png");
	});

	test("sv0_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_F_2.png");
	});

	test("sv0_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				const renderingFinished = new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
				await renderingFinished;
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_S_ss_N.png");
	});

	test("sv0_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_I_ss_N.png");
	});

	test("sv0_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_N_2.png");
	});

	test("sv0_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_S_ss_M.png");
	});

	test("sv0_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_I_ss_M.png");
	});

	test("sv0_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv0_vis_M_ss_M_2.png");
	});

	// ---- sv1: session (loadOutputs: false) first, then viewport ----

	test("sv1_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_S_ss_F.png");
	});

	test("sv1_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_I_ss_F.png");
	});

	test("sv1_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_F_2.png");
	});

	test("sv1_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_S_ss_N.png");
	});

	test("sv1_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_I_ss_N.png");
	});

	test("sv1_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_N_2.png");
	});

	test("sv1_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_S_ss_M.png");
	});

	test("sv1_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_I_ss_M.png");
	});

	test("sv1_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					loadOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
		});
		await expect(page).toHaveScreenshot(name + "/sv1_vis_M_ss_M_2.png");
	});

	// ---- sv2: session (waitForOutputs: false) first, then viewport ----

	test("sv2_vis_S_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_S_ss_F.png");
	});

	test("sv2_vis_I_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_I_ss_F.png");
	});

	test("sv2_vis_M_ss_F", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_F_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_F_2.png");
	});

	test("sv2_vis_S_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_S_ss_N.png");
	});

	test("sv2_vis_I_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_I_ss_N.png");
	});

	test("sv2_vis_M_ss_N", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_N_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_N_2.png");
	});

	test("sv2_vis_S_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_S_ss_M.png");
	});

	test("sv2_vis_I_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.INSTANT,
					branding: {logo},
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
						async () => {
							if (!SDV.sceneTree.root.boundingBox.isEmpty())
								resolve();
						},
					);
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_I_ss_M.png");
	});

	test("sv2_vis_M_ss_M", async ({page}) => {
		await page.evaluate(
			async ({ticket, modelViewUrl, logo}: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				await SDV.createSession({
					id: "mySession",
					ticket,
					modelViewUrl,
					waitForOutputs: false,
				});
				await SDV.createViewport({
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					sessionSettingsId: "mySession",
					sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
					visibility: SDV.VISIBILITY_MODE.MANUAL,
					branding: {logo},
				});
			},
			{ticket: shelfTicket, modelViewUrl, logo},
		);
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_M_1.png");
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			SDV.viewports["myViewer"].show = true;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						if (!SDV.sceneTree.root.boundingBox.isEmpty())
							resolve();
					},
				);
			});
		});
		await expect(page).toHaveScreenshot(name + "/sv2_vis_M_ss_M_2.png");
	});
});
