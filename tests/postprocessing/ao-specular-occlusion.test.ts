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

/** Replaces the AO effect with the given token by one with the given specularOcclusion. */
const setSpecularOcclusion = (
	page: Page,
	token: string,
	specularOcclusion: string | undefined,
) =>
	changeAndSettle(
		page,
		`const [token, specularOcclusion] = JSON.parse(arg);
		SDV.viewports.myViewport.postProcessing.updateEffect(token, {
			type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			properties: {mode: "shading", excludeGems: true, specularOcclusion},
		});`,
		JSON.stringify([token, specularOcclusion]),
	);

test.describe("Ambient occlusion specular occlusion", () => {
	test("uniform changes the shading, unset and physical keep the old look", async ({
		page,
	}) => {
		const glErrors: string[] = [];
		page.on("console", (message) => {
			if (/GL_INVALID|WebGL: INVALID/.test(message.text()))
				glErrors.push(message.text());
		});
		await page.goto("test-cdn/index.html");
		const token = (await changeAndSettle(
			page,
			`const viewport = await SDV.createViewport({
				id: "myViewport",
				canvas: document.getElementById("canvas"),
			});
			await SDV.createSession({
				id: "mySession",
				ticket: arg,
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;
			viewport.clearColor = "#e4e4e4";
			viewport.toneMapping = SDV.TONE_MAPPING.ACES_FILMIC;
			viewport.postProcessing.hdr = true;
			return viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				properties: {mode: "shading", excludeGems: true},
			});`,
			shelfTicket,
		))!;
		const unset = await page.locator("#canvas").screenshot();

		await setSpecularOcclusion(page, token, "uniform");
		const uniform = await page.locator("#canvas").screenshot();
		const stored = await page.evaluate(() => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			return SDV.viewports["myViewport"].postProcessing
				.getPostProcessingEffectsArray()
				.map(
					(e) =>
						(e.properties as {specularOcclusion?: string})
							?.specularOcclusion,
				);
		});
		// the model may bring effects of its own
		expect(stored).toContain("uniform");

		await setSpecularOcclusion(page, token, "physical");
		const physical = await page.locator("#canvas").screenshot();
		await setSpecularOcclusion(page, token, undefined);
		const unsetAgain = await page.locator("#canvas").screenshot();

		// the AO darkens the reflections differently
		expect(uniform.equals(unset)).toBe(false);
		// "physical" is the old look, and so is the unset property
		expect(physical.equals(unset)).toBe(true);
		expect(unsetAgain.equals(unset)).toBe(true);
		expect(glErrors).toEqual([]);
	});
});
