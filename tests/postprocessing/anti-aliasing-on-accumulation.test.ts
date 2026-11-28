import {expect, type Page, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdr7euc1} from "../models.json";

const shelfTicket = sdr7euc1.models["Shelf"].ticket;

// SS-10701: postProcessing.antiAliasingOnAccumulation false skips the
// SMAA/FXAA pass on the HDR mean of a still view once it holds two or more
// frames. The first frame and moving frames keep the pass.

interface Shot {
	technique: string;
	onAccumulation: boolean;
	frames: number;
	mode?: "display" | "hdr";
}

/**
 * Creates the viewport once. With `keepModelEffects` false, the model's own
 * effects (a composited SSAO) are replaced by one effect that is not ambient
 * occlusion, so the frame is drawn through the post-processing without AO.
 */
const createViewport = (page: Page, keepModelEffects = false) =>
	page.evaluate(
		async ([ticket, keepModelEffects]) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket: <string>ticket,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.postProcessing.hdr = true;
			// as with every HDR preset: the tone mapping pass follows the
			// anti-aliasing pass and reads the mean directly when it is skipped
			viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
			if (!keepModelEffects) {
				const tokens = viewport.postProcessing.getEffectTokens();
				for (const t in tokens) viewport.postProcessing.removeEffect(t);
				viewport.postProcessing.addEffect({
					type: SDV.POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
					properties: {hue: 0, saturation: 0.2},
				});
			}
			await viewport.getSettledScreenshot();
		},
		[shelfTicket, keepModelEffects],
	);

/**
 * A hash of the settled image (the mean of `frames` frames) for the given
 * settings, so a failing comparison prints two short strings.
 */
const settled = (page: Page, shot: Shot) =>
	page.evaluate(async (shot: Shot) => {
		const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
		const viewport = SDV.viewports["myViewport"];
		viewport.postProcessing.antiAliasingTechnique = <any>shot.technique;
		viewport.postProcessing.antiAliasingOnAccumulation =
			shot.onAccumulation;
		viewport.accumulationFrames = shot.frames;
		viewport.accumulationMode = shot.mode ?? "hdr";
		// a camera move starts a new still image with the new settings
		await viewport.camera!.set(
			viewport.camera!.position,
			viewport.camera!.target,
		);
		viewport.update();
		const image = await viewport.getSettledScreenshot();
		const hash = await crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(image),
		);
		return [...new Uint8Array(hash)]
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}, shot);

/**
 * With the option false and SMAA: the number of frames of a settled 8-frame
 * mean in which the anti-aliasing pass (the pass before the tone mapping)
 * left the buffers alone.
 */
const skippedFrames = (page: Page) =>
	page.evaluate(async () => {
		const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
		const viewport = SDV.viewports["myViewport"];
		viewport.postProcessing.antiAliasingTechnique = <any>"smaa";
		viewport.postProcessing.antiAliasingOnAccumulation = false;
		viewport.accumulationFrames = 8;
		viewport.accumulationMode = "hdr";
		viewport.update();
		await viewport.getSettledScreenshot();
		const passes = viewport.postProcessing.effectComposer!.passes;
		const pass: any = passes[passes.length - 2];
		const render = pass.render.bind(pass);
		let skipped = 0;
		pass.render = (...args: unknown[]) => {
			render(...args);
			if (!pass.needsSwap) skipped++;
		};
		await viewport.camera!.set(
			viewport.camera!.position,
			viewport.camera!.target,
		);
		viewport.update();
		await viewport.getSettledScreenshot();
		return skipped;
	});

const collectErrors = (page: Page) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	page.on("console", (message) => {
		if (/GL_INVALID|WebGL: INVALID/.test(message.text()))
			errors.push(message.text());
	});
	return errors;
};

test.describe("Anti-aliasing on the accumulated still image", () => {
	test("defaults to true and is validated", async ({page}) => {
		await page.goto("test-cdn/index.html");
		await createViewport(page);
		const result = await page.evaluate(() => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const postProcessing = SDV.viewports["myViewport"].postProcessing;
			const initial = postProcessing.antiAliasingOnAccumulation;
			let rejected = false;
			try {
				postProcessing.antiAliasingOnAccumulation = <any>"false";
			} catch {
				rejected = true;
			}
			return {
				initial,
				rejected,
				after: postProcessing.antiAliasingOnAccumulation,
			};
		});
		expect(result).toEqual({initial: true, rejected: true, after: true});
	});

	test("false: the settled image equals the one without anti-aliasing, the first frame keeps SMAA", async ({
		page,
	}) => {
		const errors = collectErrors(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page);

		const smaa = await settled(page, {
			technique: "smaa",
			onAccumulation: true,
			frames: 8,
		});
		const none = await settled(page, {
			technique: "none",
			onAccumulation: true,
			frames: 8,
		});
		const skipped = await settled(page, {
			technique: "smaa",
			onAccumulation: false,
			frames: 8,
		});
		// true (the default) keeps SMAA on the mean, as before
		expect(smaa).not.toEqual(none);
		// false: no SMAA on the mean
		expect(skipped).toEqual(none);

		// a single frame is the first frame of a mean: it keeps SMAA
		const firstOn = await settled(page, {
			technique: "smaa",
			onAccumulation: true,
			frames: 1,
		});
		const firstOff = await settled(page, {
			technique: "smaa",
			onAccumulation: false,
			frames: 1,
		});
		const firstNone = await settled(page, {
			technique: "none",
			onAccumulation: true,
			frames: 1,
		});
		expect(firstOff).toEqual(firstOn);
		expect(firstOff).not.toEqual(firstNone);
		expect(errors).toEqual([]);
	});

	test("false also skips FXAA; a composited AO keeps its pass", async ({
		page,
	}) => {
		const errors = collectErrors(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page);
		const fxaa = await settled(page, {
			technique: "fxaa",
			onAccumulation: true,
			frames: 8,
		});
		const fxaaSkipped = await settled(page, {
			technique: "fxaa",
			onAccumulation: false,
			frames: 8,
		});
		const none = await settled(page, {
			technique: "none",
			onAccumulation: true,
			frames: 8,
		});
		expect(fxaa).not.toEqual(none);
		expect(fxaaSkipped).toEqual(none);

		expect(await skippedFrames(page)).toBeGreaterThan(0);

		// The model's own composited SSAO is drawn after the mean from the last
		// frame alone, so it keeps its pass. (Its settled images vary between
		// page loads, so the passes are counted instead of comparing images.)
		await page.goto("test-cdn/index.html");
		await createViewport(page, true);
		expect(await skippedFrames(page)).toBe(0);
		expect(errors).toEqual([]);
	});

	test("no effect with accumulationMode display", async ({page}) => {
		const errors = collectErrors(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page);
		const on = await settled(page, {
			technique: "smaa",
			onAccumulation: true,
			frames: 8,
			mode: "display",
		});
		const off = await settled(page, {
			technique: "smaa",
			onAccumulation: false,
			frames: 8,
			mode: "display",
		});
		expect(off).toEqual(on);
		expect(errors).toEqual([]);
	});
});
