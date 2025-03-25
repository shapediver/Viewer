import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import webdriver from "selenium-webdriver";

import {sdr7euc1} from "../../general/src/models";
import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");

const shelfTicket = sdr7euc1.models["Shelf"].ticket;

let driver: webdriver.WebDriver;
let name = "postprocessing";

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

	test(name + "_on_off", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_off");

		const effectTokens = await driver.executeAsyncScript(
			async (cb: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				let viewport = SDV.viewports["myViewport"];

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
				cb([bloomEffectToken]);
			},
		);
		await screenshotCompare(await driver.takeScreenshot(), name + "_on");

		await driver.executeAsyncScript(
			async (effectTokens: string[], cb: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				let viewport = SDV.viewports["myViewport"];

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
				cb();
			},
			effectTokens,
		);
		await screenshotCompare(await driver.takeScreenshot(), name + "_off");
	});

	test(name + "_bloom_mipmap", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_bloom_mipmap",
		);
	});

	test(name + "_bloom", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const bloomEffectToken = viewport.postProcessing.addEffect({
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
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_bloom");
	});

	test(name + "_chromaticAberration", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			const chromaticAberrationEffectToken =
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_chromaticAberration",
		);
	});

	test(name + "_depthOfField", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const depthOfFieldEffectToken = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,

				properties: {
					/** The scale of the bokeh blur. (default: 1.0) */
					bokehScale: 8,
					/** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
					focusDistance: 0.05,
					/** The focus range. Range is [0.0, 1.0]. (default: 0.1) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_depthOfField",
		);
	});

	test(name + "_dotScreen", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const dotScreenEffectToken = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,

				properties: {
					/** The angle of the dot pattern. (default: 1.57) */
					angle: 1.57,
					/** The scale of the dot pattern. (default: 1.0) */
					scale: 1.0,
				},
			});

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_dotScreen",
		);
	});

	test(name + "_godRays", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const godRaysEffectToken = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
				properties: {
					decay: 1,
					weight: 0.6,
				},
			});
			const godRaysEffect =
				viewport.postProcessing.getEffect(godRaysEffectToken);
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_godRays",
		);
	});

	test(name + "_grid", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const gridEffectToken = viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.MULTIPLY,
					/** The scale of the grid pattern. (default: 1.0) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_grid");
	});

	test(name + "_hbao", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const hbaoEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The resolution scale of the ambient occlusion. (default: 1) */
					resolutionScale: 1,
					/** The samples that are taken per pixel to compute the ambient occlusion. (default: 16) */
					spp: 16,
					/** Controls the radius/size of the ambient occlusion in world units. (default: 2) */
					distance: 1,
					/** Controls how fast the ambient occlusion fades away with distance in world units. (default: 1) */
					distanceIntensity: 1,
					/** A purely artistic control for the intensity of the AO - runs the ao through the function pow(ao, intensity), which has the effect of darkening areas with more ambient occlusion. (default: 2.5) */
					intensity: 2.5,
					/** The color of the ambient occlusion. (default: black) */
					color: "#000000",
					/** The bias that is used for the effect in world units. (default: 40) */
					bias: 40,
					/** The thickness if the ambient occlusion effect. (default: 0.075) */
					thickness: 0.075,

					/** The number of iterations of the denoising pass. (default: 1) */
					iterations: 1,
					/** The radius of the poisson disk. (default: 12) */
					radius: 12,
					/** The rings of the poisson disk. (default: 11) */
					rings: 11,
					/** Allows to adjust the influence of the luma difference in the denoising pass. (default: 10) */
					lumaPhi: 10,
					/** Allows to adjust the influence of the depth difference in the denoising pass. (default: 2) */
					depthPhi: 2,
					/** Allows to adjust the influence of the normal difference in the denoising pass. (default: 3.25) */
					normalPhi: 3.25,
					/** The samples that are used in the poisson disk. (default: 16) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_hbao");
	});

	test(name + "_hueSaturation", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const hueSaturationEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The hue in radians. (default: 0.0) */
					hue: 2,
					/** The saturation factor, ranging from -1 to 1, where 0 means no change. (default: 0.0) */
					saturation: 0.5,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
			});

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_hueSaturation",
		);
	});

	/**
	 * Noise cannot be tested with screenshots as the noise is random.
	 */

	// test(name + "_noise", async () => {
	//     await driver.executeAsyncScript(async (ticket: string, cb: any) => {
	//         const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
	//         let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
	//         let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com' });

	//         const noiseEffectToken = viewport.postProcessing.addEffect({
	//             /** Whether the noise should be multiplied with the input colors prior to blending. (default: false) */
	//             premultiply: false,
	//             type: SDV.POST_PROCESSING_EFFECT_TYPE.NOISE
	//         })

	//         await new Promise<void>((resolve) => {
	//             SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
	//         })
	//         cb();
	//     }, shelfTicket);
	//     await screenshotCompare(await driver.takeScreenshot(), name + "_noise");
	// });

	test(name + "_outline", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const outlineEffectToken = viewport.postProcessing.addEffect({
				properties: {
					blendFunction: SDV.BlendFunction.ALPHA,
					/** Whether the outline should be blurred. (default: false) */
					blur: true,
					/** The edge strength. (default: 1.0) */
					edgeStrength: 50,
					/** The color of hidden edges. (default: #22090a) */
					hiddenEdgeColor: "#22090a",
					/** The blur kernel size. (default: KernelSize.VERY_SMALL) */
					kernelSize: SDV.KernelSize.MEDIUM,
					/** The number of samples used for multisample antialiasing. Requires WebGL 2. (default: 0) */
					multisampling: 0,
					/** The pulse speed. A value of zero disables the pulse effect. (default: 0.0) */
					pulseSpeed: 0,
					/** The color of visible edges. (default: #ffffff) */
					visibleEdgeColor: "#ff0000",
					/** Whether occluded parts of selected objects should be visible. (default: true) */
					xRay: true,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.OUTLINE,
			});
			const outlineEffect =
				viewport.postProcessing.getEffect(outlineEffectToken);
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_outline",
		);
	});

	test(name + "_pixelation", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const pixelationEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The pixel granularity. (default: 30.0) */
					granularity: 30.0,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.PIXELATION,
			});

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_pixelation",
		);
	});

	test(name + "_ssao", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const ssaoEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The resolution scale of the ambient occlusion. (default: 1) */
					resolutionScale: 1,
					/** The samples that are taken per pixel to compute the ambient occlusion. (default: 16) */
					spp: 16,
					/** Controls the radius/size of the ambient occlusion in world units. (default: 2) */
					distance: 1,
					/** Controls how fast the ambient occlusion fades away with distance in world units. (default: 1) */
					distanceIntensity: 1,
					/** A purely artistic control for the intensity of the AO - runs the ao through the function pow(ao, intensity), which has the effect of darkening areas with more ambient occlusion. (default: 2.5) */
					intensity: 2.5,
					/** The color of the ambient occlusion. (default: black) */
					color: "#000000",

					/** The number of iterations of the denoising pass. (default: 1) */
					iterations: 1,
					/** The radius of the poisson disk. (default: 12) */
					radius: 12,
					/** The rings of the poisson disk. (default: 11) */
					rings: 11,
					/** Allows to adjust the influence of the luma difference in the denoising pass. (default: 10) */
					lumaPhi: 10,
					/** Allows to adjust the influence of the depth difference in the denoising pass. (default: 2) */
					depthPhi: 2,
					/** Allows to adjust the influence of the normal difference in the denoising pass. (default: 3.25) */
					normalPhi: 3.25,
					/** The samples that are used in the poisson disk. (default: 16) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_ssao");
	});

	test(name + "_scanline", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const scanlineEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The blend function of this effect. (default: BlendFunction.OVERLAY) */
					blendFunction: SDV.BlendFunction.OVERLAY,
					/** The scanline density. (default: 1.25) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_scanline",
		);
	});

	test(name + "_selectiveBloom", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const selectiveBloomEffectToken = viewport.postProcessing.addEffect(
				{
					type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
					properties: {
						/** The blend function of this effect. (default: BlendFunction.ADD) */
						blendFunction: SDV.BlendFunction.ADD,
						/** The bloom intensity. (default: 1.0) */
						intensity: 10.0,
						/** The blur kernel size. (default: KernelSize.LARGE) */
						kernelSize: SDV.KernelSize.LARGE,
						/** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
						luminanceSmoothing: 0,
						/** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
						luminanceThreshold: 0,
						/** Enables or disables mipmap blur. (default: false) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_selectiveBloom",
		);
	});

	test(name + "_selectiveBloom_mipmap", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const selectiveBloomEffectToken = viewport.postProcessing.addEffect(
				{
					type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
					properties: {
						/** The blend function of this effect. (default: BlendFunction.ADD) */
						blendFunction: SDV.BlendFunction.ADD,
						/** The bloom intensity. (default: 1.0) */
						intensity: 10.0,
						/** The blur kernel size. (default: KernelSize.LARGE) */
						kernelSize: SDV.KernelSize.LARGE,
						/** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
						luminanceSmoothing: 0,
						/** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
						luminanceThreshold: 0,
						/** Enables or disables mipmap blur. (default: false) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_selectiveBloom_mipmap",
		);
	});

	test(name + "_sepia", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const sepiaEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The blend function of this effect. (default: BlendFunction.NORMAL) */
					blendFunction: SDV.BlendFunction.NORMAL,
				},
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SEPIA,
			});

			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "_sepia");
	});

	test(name + "_tiltShift", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const tiltShiftEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The blend function of this effect. (default: BlendFunction.NORMAL) */
					blendFunction: SDV.BlendFunction.NORMAL,
					/** The softness of the focus area edges. (default: 0.3) */
					feather: 0.3,
					/** The relative size of the focus area. (default: 0.4) */
					focusArea: 0.4,
					/** The blur kernel size. (default: KernelSize.MEDIUM) */
					kernelSize: SDV.KernelSize.MEDIUM,
					/** The relative offset of the focus area. (default: 0.0) */
					offset: 0,
					/** The rotation of the focus area in radians. (default: 0.0) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_tiltShift",
		);
	});

	test(name + "_vignette", async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});

			const vignetteEffectToken = viewport.postProcessing.addEffect({
				properties: {
					/** The blend function of this effect. (default: BlendFunction.NORMAL) */
					blendFunction: SDV.BlendFunction.NORMAL,
					/** The Vignette darkness. (default: 0.5) */
					darkness: 0.5,
					/** The Vignette offset. (default: 0.5) */
					offset: 0.5,
					/** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
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
			cb();
		}, shelfTicket);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "_vignette",
		);
	});
});
