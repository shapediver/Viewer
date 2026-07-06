import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdr7euc1} from "../models.json";

const shelfTicket = sdr7euc1.models["Shelf"].ticket;
const name = "postprocessing";

test.describe("Post-processing", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto(
			"test-cdn/index.html",
		);
	});

	test("on_off", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_off.png");

		const effectTokens: string[] = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewport"];

			const bloomEffectToken = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
				properties: {
					mipmapBlur: true,
					intensity: 5,
					luminanceSmoothing: 0,
					luminanceThreshold: 0.7,
				},
			});

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			return [bloomEffectToken];
		});
		await expect(page).toHaveScreenshot(name + "_on.png");

		await page.evaluate(async (effectTokens: string[]) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = SDV.viewports["myViewport"];
			effectTokens.forEach((token) => {
				viewport.postProcessing.removeEffect(token);
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, effectTokens);
		await expect(page).toHaveScreenshot(name + "_off.png");
	});

	test("bloom_mipmap", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
				properties: {
					mipmapBlur: true,
					intensity: 5,
					luminanceSmoothing: 0,
					luminanceThreshold: 0.7,
				},
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_bloom_mipmap.png");
	});

	test("bloom", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
				properties: {
					mipmapBlur: false,
					intensity: 2,
					luminanceSmoothing: 0.35,
					luminanceThreshold: 0.5,
				},
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_bloom.png");
	});

	test("chromaticAberration", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_chromaticAberration.png");
	});

	test("depthOfField", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,
				properties: {
					bokehScale: 8,
					focusDistance: 0.05,
					focusRange: 0.025,
				},
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_depthOfField.png");
	});

	test("dotScreen", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,
				properties: {angle: 1.57, scale: 1.0},
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_dotScreen.png");
	});

	test("godRays", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			const godRaysEffectToken = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
				properties: {decay: 1, weight: 0.6},
			});
			viewport.postProcessing.godRaysEffects[
				godRaysEffectToken
			].setLightSource(
				session
					.getOutputByName("HorizontalBottom")
					.find((o) => !o.format.includes("material"))!.node!,
			);
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_godRays.png");
	});

	test("grid", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.MULTIPLY,
					scale: 1.0,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.GRID,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_grid.png");
	});

	test("hbao", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					resolutionScale: 1,
					spp: 16,
					distance: 1,
					distanceIntensity: 1,
					intensity: 2.5,
					color: "#000000",
					bias: 40,
					thickness: 0.075,
					iterations: 1,
					radius: 12,
					rings: 11,
					lumaPhi: 10,
					depthPhi: 2,
					normalPhi: 3.25,
					samples: 16,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.HBAO,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_hbao.png");
	});

	test("hueSaturation", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {hue: 2, saturation: 0.5},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_hueSaturation.png");
	});

	test("outline", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			const outlineEffectToken = viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.ALPHA,
					blur: true,
					edgeStrength: 50,
					hiddenEdgeColor: "#22090a",
					kernelSize: SDV.KernelSize.MEDIUM,
					multisampling: 0,
					pulseSpeed: 0,
					visibleEdgeColor: "#ff0000",
					xRay: true,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.OUTLINE,
			});
			viewport.postProcessing.outlineEffects[
				outlineEffectToken
			].addSelection(session.node!);
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_outline.png");
	});

	test("pixelation", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {granularity: 30.0},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.PIXELATION,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_pixelation.png");
	});

	test("ssao", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					resolutionScale: 1,
					spp: 16,
					distance: 1,
					distanceIntensity: 1,
					intensity: 2.5,
					color: "#000000",
					iterations: 1,
					radius: 12,
					rings: 11,
					lumaPhi: 10,
					depthPhi: 2,
					normalPhi: 3.25,
					samples: 16,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_ssao.png");
	});

	test("scanline", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.OVERLAY,
					density: 1.25,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SCANLINE,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_scanline.png");
	});

	test("selectiveBloom", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			const selectiveBloomEffectToken = viewport.postProcessing.addEffect(
				{
					type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
					properties: {
						blendFunction: SDV.BlendFunction.ADD,
						intensity: 10.0,
						kernelSize: SDV.KernelSize.LARGE,
						luminanceSmoothing: 0,
						luminanceThreshold: 0,
						mipmapBlur: false,
					},
				},
			);
			const selectiveBloomEffect = viewport.postProcessing.getEffect(
				selectiveBloomEffectToken,
			);
			(<any>selectiveBloomEffect).ignoreBackground = true;
			viewport.postProcessing.selectiveBloomEffects[
				selectiveBloomEffectToken
			].addSelection(session.node!);
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_selectiveBloom.png");
	});

	test("selectiveBloom_mipmap", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			const selectiveBloomEffectToken = viewport.postProcessing.addEffect(
				{
					type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
					properties: {
						blendFunction: SDV.BlendFunction.ADD,
						intensity: 10.0,
						kernelSize: SDV.KernelSize.LARGE,
						luminanceSmoothing: 0,
						luminanceThreshold: 0,
						mipmapBlur: true,
					},
				},
			);
			const selectiveBloomEffect = viewport.postProcessing.getEffect(
				selectiveBloomEffectToken,
			);
			(<any>selectiveBloomEffect).ignoreBackground = true;
			viewport.postProcessing.selectiveBloomEffects[
				selectiveBloomEffectToken
			].addSelection(session.node!);
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(
			name + "_selectiveBloom_mipmap.png",
		);
	});

	test("sepia", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {blendFunction: SDV.BlendFunction.NORMAL},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SEPIA,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_sepia.png");
	});

	test("tiltShift", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.NORMAL,
					feather: 0.3,
					focusArea: 0.4,
					kernelSize: SDV.KernelSize.MEDIUM,
					offset: 0,
					rotation: 0,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_tiltShift.png");
	});

	test("vignette", async ({page}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.NORMAL,
					darkness: 0.5,
					offset: 0.5,
					technique: SDV.VignetteTechnique.DEFAULT,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		}, shelfTicket);
		await expect(page).toHaveScreenshot(name + "_vignette.png");
	});
});
