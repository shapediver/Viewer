import {expect, type Page, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdr7euc1} from "../models.json";

const shelfTicket = sdr7euc1.models["Shelf"].ticket;

/**
 * Runs the change in the page and waits until the beauty rendering after it
 * has finished. The listener is added before the change, so it cannot be missed.
 */
const changeAndSettle = (page: Page, change: string, arg?: string) =>
	page.evaluate(
		async ({change, arg}) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const finished = new Promise<void>((resolve) => {
				const token = SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => {
						SDV.removeListener(token);
						resolve();
					},
				);
			});
			const result = await new Function(
				"SDV",
				"arg",
				`return (async () => { ${change} })();`,
			)(SDV, arg);
			await finished;
			return result as string | undefined;
		},
		{change, arg},
	);

/** Replaces the AO effect with the given token by a "shading" SSAO with the given algorithm. */
const setAlgorithm = (
	page: Page,
	token: string,
	algorithm: string | undefined,
) =>
	changeAndSettle(
		page,
		`const [token, algorithm] = JSON.parse(arg);
		SDV.viewports.myViewport.postProcessing.updateEffect(token, {
			type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			properties: {mode: "shading", excludeGems: true, algorithm},
		});`,
		JSON.stringify([token, algorithm]),
	);

/**
 * Creates the viewport with a "shading" SSAO. The anti-aliasing technique, if
 * given, is set before the effect is added, so the passes are built with it.
 */
const createViewport = (page: Page, technique?: string) =>
	changeAndSettle(
		page,
		`const [ticket, technique] = JSON.parse(arg);
		const viewport = await SDV.createViewport({
			id: "myViewport",
			canvas: document.getElementById("canvas"),
		});
		await SDV.createSession({
			id: "mySession",
			ticket,
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		});
		viewport.beautyRenderDelay = 100;
		viewport.beautyRenderBlendingDuration = 1;
		viewport.clearColor = "#e4e4e4";
		viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
		viewport.postProcessing.hdr = true;
		// the model brings an SSAO of its own (not in the "shading" mode), which would
		// always add the anti-aliasing pass
		for (const effect of viewport.postProcessing.getPostProcessingEffectsArray())
			viewport.postProcessing.removeEffect(effect.token);
		// the model brings a composite SSAO of its own, which keeps the AA pass
		const tokens = viewport.postProcessing.getEffectTokens();
		for (const t in tokens) viewport.postProcessing.removeEffect(t);
		if (technique) viewport.postProcessing.antiAliasingTechnique = technique;
		return viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			properties: {mode: "shading", excludeGems: true},
		});`,
		JSON.stringify([shelfTicket, technique ?? null]),
	);

const collectGlErrors = (page: Page) => {
	const glErrors: string[] = [];
	page.on("console", (message) => {
		if (/GL_INVALID|WebGL: INVALID/.test(message.text()))
			glErrors.push(message.text());
	});
	return glErrors;
};

test.describe("SSAO algorithm", () => {
	test("sao changes the occlusion, unset and hemisphere keep the old look", async ({
		page,
	}) => {
		const glErrors = collectGlErrors(page);
		await page.goto("test-cdn/index.html");
		const token = (await createViewport(page))!;
		const unset = await page.locator("#canvas").screenshot();

		await setAlgorithm(page, token, "sao");
		const sao = await page.locator("#canvas").screenshot();
		const stored = await page.evaluate(() => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			return SDV.viewports["myViewport"].postProcessing
				.getPostProcessingEffectsArray()
				.map((e) => (e.properties as {algorithm?: string})?.algorithm);
		});
		expect(stored).toContain("sao");

		await setAlgorithm(page, token, "hemisphere");
		const hemisphere = await page.locator("#canvas").screenshot();
		await setAlgorithm(page, token, undefined);
		const unsetAgain = await page.locator("#canvas").screenshot();

		// another algorithm darkens other places
		expect(sao.equals(unset)).toBe(false);
		// "hemisphere" is the old look, and so is the unset property
		expect(hemisphere.equals(unset)).toBe(true);
		expect(unsetAgain.equals(unset)).toBe(true);
		expect(glErrors).toEqual([]);
	});

	test("in the shading mode the AO anti-aliasing follows the technique", async ({
		page,
	}) => {
		const glErrors = collectGlErrors(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page);
		const smaa = await page.locator("#canvas").screenshot();

		// "none": no anti-aliasing pass (before, the AO always added SMAA)
		await page.goto("test-cdn/index.html");
		await createViewport(page, "none");
		const none = await page.locator("#canvas").screenshot();

		expect(none.equals(smaa)).toBe(false);
		expect(glErrors).toEqual([]);
	});
});
