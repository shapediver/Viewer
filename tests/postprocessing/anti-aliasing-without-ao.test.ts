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

/**
 * Creates the viewport with the given anti-aliasing technique. With
 * `keepModelEffects` false, the model's own effects (a composited SSAO) are
 * removed and one effect that is not ambient occlusion is added, so the
 * frame is drawn through the post-processing without AO.
 */
const createViewport = (
	page: Page,
	technique: string,
	keepModelEffects = false,
) =>
	changeAndSettle(
		page,
		`const [ticket, technique, keepModelEffects] = JSON.parse(arg);
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
		viewport.postProcessing.antiAliasingTechnique = technique;
		if (keepModelEffects) return;
		const tokens = viewport.postProcessing.getEffectTokens();
		for (const t in tokens) viewport.postProcessing.removeEffect(t);
		viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION,
			properties: {hue: 0, saturation: 0.2},
		});`,
		JSON.stringify([shelfTicket, technique, keepModelEffects]),
	);

const setTechnique = (page: Page, technique: string) =>
	changeAndSettle(
		page,
		"SDV.viewports.myViewport.postProcessing.antiAliasingTechnique = arg;",
		technique,
	);

const capture = (page: Page) => page.locator("#canvas").screenshot();

const collectGlErrors = (page: Page) => {
	const glErrors: string[] = [];
	page.on("console", (message) => {
		if (/GL_INVALID|WebGL: INVALID/.test(message.text()))
			glErrors.push(message.text());
	});
	return glErrors;
};

test.describe("Anti-aliasing with post-processing but without ambient occlusion", () => {
	test("smaa and fxaa smooth the edges, none does not", async ({page}) => {
		const glErrors = collectGlErrors(page);
		const shots: {[technique: string]: Buffer} = {};
		for (const technique of ["smaa", "fxaa", "none"]) {
			await page.goto("test-cdn/index.html");
			await createViewport(page, technique);
			shots[technique] = await capture(page);
		}

		// before SS-10691 all three were identical: no anti-aliasing at all
		expect(shots.smaa.equals(shots.none)).toBe(false);
		expect(shots.fxaa.equals(shots.none)).toBe(false);
		expect(shots.fxaa.equals(shots.smaa)).toBe(false);
		expect(glErrors).toEqual([]);
	});

	test("changing the technique at runtime rebuilds the passes", async ({
		page,
	}) => {
		const glErrors = collectGlErrors(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page, "smaa");
		const smaa = await capture(page);

		await setTechnique(page, "none");
		const none = await capture(page);
		await setTechnique(page, "smaa");
		const smaaAgain = await capture(page);

		expect(none.equals(smaa)).toBe(false);
		expect(smaaAgain.equals(smaa)).toBe(true);
		expect(glErrors).toEqual([]);
	});

	test("a composited AO keeps its SMAA pass with none, as before", async ({
		page,
	}) => {
		const glErrors = collectGlErrors(page);
		// the model brings a composited SSAO of its own
		await page.goto("test-cdn/index.html");
		await createViewport(page, "smaa", true);
		const smaa = await capture(page);
		await page.goto("test-cdn/index.html");
		await createViewport(page, "none", true);
		const none = await capture(page);

		expect(none.equals(smaa)).toBe(true);
		expect(glErrors).toEqual([]);
	});
});
