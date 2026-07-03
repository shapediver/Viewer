import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const name = "animation";

test.describe("Animation", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"/test-cdn/index.html",
		);
	});

	test("translation", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
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
			const tracks: ShapeDiverViewer.IAnimationTrack[] = [
				{
					times: [0, 0.5],
					node: session.node,
					values: [0, 0, 0, 25, 0, 0],
					path: "translation",
					interpolation: "linear",
				},
			];
			const data = new SDV.AnimationData("myAnimation", tracks, 0, 0.5);
			data.reset = false;
			session.node.data.push(data);
			data.startAnimation();
			viewer.update();
			await new Promise((resolve) => setTimeout(resolve, 600));
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/translation.png", {
			timeout: 15000,
		});
	});

	test("rotation", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
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
			const tracks: ShapeDiverViewer.IAnimationTrack[] = [
				{
					times: [0, 0.5],
					node: session.node,
					values: [0, 0, 0, 1, 0, 0, 1, 0],
					path: "rotation",
					interpolation: "linear",
				},
			];
			const data = new SDV.AnimationData("myAnimation", tracks, 0, 0.5);
			data.reset = false;
			session.node.data.push(data);
			data.startAnimation();
			viewer.update();
			await new Promise((resolve) => setTimeout(resolve, 600));
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/rotation.png", {
			timeout: 15000,
		});
	});

	test("scale", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
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
			const tracks: ShapeDiverViewer.IAnimationTrack[] = [
				{
					times: [0, 0.5],
					node: session.node,
					values: [1, 1, 1, 1.5, 1.5, 1.5],
					path: "scale",
					interpolation: "linear",
				},
			];
			const data = new SDV.AnimationData("myAnimation", tracks, 0, 0.5);
			data.reset = false;
			session.node.data.push(data);
			data.startAnimation();
			viewer.update();
			await new Promise((resolve) => setTimeout(resolve, 600));
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "/scale.png", {
			timeout: 15000,
		});
	});
});
