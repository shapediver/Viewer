import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const name = "parameters";

test.describe("Parameters", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);
	});

	test("iteration", async ({page}) => {
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
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
				SDV.viewports["myViewer"]!.render();
			});
		}, shelfTicket);

		for (let i = 2; i <= 10; i++) {
			await page.evaluate(async (i: number) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				const session = SDV.sessions["mySession"]!;
				session.getParameterById(
					"de76cade-0cea-47b1-879e-1a0b717910e1",
				)!.value = i;
				await Promise.all([
					new Promise<void>((resolve) => {
						SDV.addListener(
							(<any>window).SDV.EVENTTYPE.RENDERING
								.BEAUTY_RENDERING_FINISHED,
							async () => resolve(),
						);
					}),
					session.customize(),
				]);
			}, i);
			await expect(page).toHaveScreenshot(name + "/" + i + ".png");
		}
	});

	test("undo", async ({page}) => {
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
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot("undo/change_4.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			session.getParameterById(
				"de76cade-0cea-47b1-879e-1a0b717910e1",
			)!.value = 2;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.customize(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			session.getParameterById(
				"de76cade-0cea-47b1-879e-1a0b717910e1",
			)!.value = 3;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.customize(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_3.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			session.getParameterById(
				"de76cade-0cea-47b1-879e-1a0b717910e1",
			)!.value = 4;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.customize(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_4.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			session.getParameterById(
				"de76cade-0cea-47b1-879e-1a0b717910e1",
			)!.value = 5;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.customize(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_5.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.goBack(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_4.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.goBack(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_3.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.goForward(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_4.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			session.getParameterById(
				"de76cade-0cea-47b1-879e-1a0b717910e1",
			)!.value = 2;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.customize(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			await session.goForward();
		});
		await expect(page).toHaveScreenshot("undo/change_2.png");

		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const session = SDV.sessions["mySession"]!;
			await Promise.all([
				new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				}),
				session.goBack(),
			]);
		});
		await expect(page).toHaveScreenshot("undo/change_4.png");
	});

	test("initial values", async ({page}) => {
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
				initialParameterValues: {
					"de76cade-0cea-47b1-879e-1a0b717910e1": "2",
				},
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
		await expect(page).toHaveScreenshot(name + "/initial_parameters.png");
	});
});
