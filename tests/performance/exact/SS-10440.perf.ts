import {expect} from "@playwright/test";
import {open, test} from "./harness";

test.describe("SS-10440 ambient occlusion renders at half resolution by default", () => {
	// An odd height, so half of it is not a whole number of pixels.
	test.use({viewport: {width: 1280, height: 721}, deviceScaleFactor: 1});

	test("SS-10440 the default target is half the drawing buffer and an explicit 1 is full size", async ({
		page,
	}) => {
		await open(page);
		const sizes = await page.evaluate(async () => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			perf.addBoxes(
				2,
				new SDV.MaterialStandardData({
					color: "#888888",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			);
			perf.viewport.update();
			perf.viewport.show = true;
			const frames = () => perf.nextFrame();
			const postProcessing = perf.viewport.postProcessing;
			const ssao = () => {
				const tokens = postProcessing.getEffectTokens();
				const token = Object.keys(tokens).find(
					(key) =>
						tokens[key] === SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				)!;
				return {token, effect: postProcessing.getEffect(token)};
			};
			const measure = async () => {
				await frames();
				perf.renders.length = 0;
				perf.viewport.render();
				await frames();
				const {token, effect} = ssao();
				const ao = effect.aoPass.renderTarget;
				const denoise = effect.poissionDenoisePass.renderTargetB;
				const canvas = perf.renderer.domElement as HTMLCanvasElement;
				return {
					buffer: [canvas.width, canvas.height],
					ao: [ao.width, ao.height],
					denoise: [denoise.width, denoise.height],
					scale: effect.resolutionScale,
					upsample:
						"UPSAMPLE" in
						effect.poissionDenoisePass.fullscreenMaterial.defines,
					stored: postProcessing
						.getPostProcessingEffectsArray()
						.find((e: any) => e.token === token).properties
						.resolutionScale,
					// every render target a frame drew into
					targets: [
						...new Set(
							perf.renders
								.filter((r: any) => r.target)
								.map((r: any) => r.target.join("x")),
						),
					],
				};
			};

			const defaults = postProcessing.getDefaultEffectProperties(
				SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			).resolutionScale;
			// A viewport without a session has no effects. A model without
			// stored settings gets this effect from the default settings.
			const effects =
				SDV.defaultSettings.default().postprocessing.effects;
			postProcessing.addEffect(
				effects.find(
					(e: any) => e.type === SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				),
			);
			const initial = await measure();

			// an effect that names no scale gets the default
			postProcessing.updateEffect(ssao().token, {
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				properties: {},
			});
			const omitted = await measure();

			// an explicit value is kept
			postProcessing.updateEffect(ssao().token, {
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				properties: {resolutionScale: 1},
			});
			const explicit = await measure();

			// the scale survives a resize
			const parent = (perf.renderer.domElement as HTMLCanvasElement)
				.parentElement!;
			const resize = async (width: number, height: number) => {
				parent.style.width = `${width}px`;
				parent.style.height = `${height}px`;
				await new Promise((resolve) => setTimeout(resolve, 500));
			};
			await resize(900, 501);
			const explicitResized = await measure();
			postProcessing.updateEffect(ssao().token, {
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				properties: {},
			});
			await resize(1000, 601);
			const omittedResized = await measure();

			return {
				defaults,
				initial,
				omitted,
				explicit,
				explicitResized,
				omittedResized,
			};
		});

		const half = ([width, height]: number[]) => [
			Math.round(width * 0.5),
			Math.round(height * 0.5),
		];

		expect(sizes.defaults).toBe(0.5);

		expect(sizes.initial.buffer).toEqual([1280, 721]);
		expect(sizes.initial.scale).toBe(0.5);
		expect(sizes.initial.stored).toBe(0.5);
		expect(sizes.initial.ao).toEqual([640, 361]);
		// the denoise pass is the depth-aware upsample and stays full size
		expect(sizes.initial.denoise).toEqual([1280, 721]);
		expect(sizes.initial.targets).toContain("640x361");
		expect(sizes.initial.upsample).toBe(true);
		expect(sizes.explicit.upsample).toBe(false);
		expect(sizes.omittedResized.upsample).toBe(true);

		expect(sizes.omitted.scale).toBe(0.5);
		expect(sizes.omitted.stored).toBeUndefined();
		expect(sizes.omitted.ao).toEqual([640, 361]);

		expect(sizes.explicit.scale).toBe(1);
		expect(sizes.explicit.stored).toBe(1);
		expect(sizes.explicit.ao).toEqual([1280, 721]);
		expect(sizes.explicit.targets).not.toContain("640x361");

		expect(sizes.explicitResized.buffer).toEqual([900, 501]);
		expect(sizes.explicitResized.ao).toEqual([900, 501]);

		expect(sizes.omittedResized.buffer).toEqual([1000, 601]);
		expect(sizes.omittedResized.ao).toEqual(
			half(sizes.omittedResized.buffer),
		);
		expect(sizes.omittedResized.ao).toEqual([500, 301]);
		expect(sizes.omittedResized.denoise).toEqual([1000, 601]);
		expect(sizes.omittedResized.targets).toContain("500x301");
	});
});
