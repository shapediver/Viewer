import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";

import {sdeuc1} from "../models.json";

// stored settings from before 7.2
const shelfTicket = sdeuc1.models["Shelf"].ticket;

/** Reads the rendering options that settings 7.2 added (SS-10494). */
const readOptions = () => {
	const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
	const viewport = SDV.viewports["myViewport"];
	const effects = viewport.postProcessing.getPostProcessingEffectsArray();
	const properties = (type: string) =>
		effects
			.filter((e) => e.type === type)
			.map((e) => <Record<string, unknown>>e.properties);
	return {
		hdr: viewport.postProcessing.hdr,
		environmentMapPbrMode: viewport.environmentMapPbrMode,
		environmentMapOrientation: viewport.environmentMapOrientation,
		environmentMapAnalyticDfg: viewport.environmentMapAnalyticDfg,
		physicalGemDispersion: viewport.physicalGemDispersion,
		physicalGemFresnel: viewport.physicalGemFresnel,
		gemEnvironmentMapIntensity: viewport.gemEnvironmentMapIntensity,
		gemTracing: viewport.gemTracing,
		gemNormalMapResolution: viewport.gemNormalMapResolution,
		toneMapping: viewport.toneMapping,
		accumulationFrames: viewport.accumulationFrames,
		accumulationFramesMobile: viewport.accumulationFramesMobile,
		aoExcludeGems: [...properties("ssao"), ...properties("hbao")].map(
			(p) => p.excludeGems === true,
		),
		bloom: properties("bloom").map((p) => ({
			highlightsOnly: p.highlightsOnly,
			backgroundBloom: p.backgroundBloom,
		})),
	};
};

/** The largest drawing buffer of the viewport on desktop (SS-10506). */
const readMaximumRenderingSize = () =>
	(<typeof ShapeDiverViewer>(<any>window).SDV).viewports["myViewport"]
		.maximumRenderingSize;

const OLD_LOOK = {
	hdr: false,
	environmentMapPbrMode: "legacy",
	environmentMapOrientation: "legacy",
	environmentMapAnalyticDfg: false,
	physicalGemDispersion: false,
	physicalGemFresnel: false,
	gemEnvironmentMapIntensity: 1,
	gemTracing: "sphere",
	gemNormalMapResolution: 1024,
	accumulationFrames: 0,
	accumulationFramesMobile: 0,
};

const NEW_LOOK = {
	environmentMapPbrMode: "modern",
	environmentMapOrientation: "threejs",
	// only the jewelry preset uses the analytic DFG
	environmentMapAnalyticDfg: false,
	physicalGemDispersion: true,
	physicalGemFresnel: true,
	gemEnvironmentMapIntensity: 1.2,
	gemTracing: "facets",
	gemNormalMapResolution: 512,
};

/** Creates the viewport and applies a default settings object, as picking a preset on the platform does. */
const applyPreset = (page: import("@playwright/test").Page, preset: string) =>
	page.evaluate(async (preset: string) => {
		const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
		const viewport = await SDV.createViewport({
			id: "myViewport",
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
		});
		const settings = (<any>SDV.defaultSettings)[preset]();
		if (settings.settings_version !== "7.2")
			throw new Error("The default settings are not version 7.2.");
		// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2,
		// the pinned version only validates up to 7.1 and keeps the 7.2 fields.
		settings.settings_version = "7.1";
		// the sections the platform applies when a preset is picked
		await viewport.applyViewportSettings(settings, {
			ar: true,
			camera: true,
			environment: true,
			general: true,
			light: true,
			postprocessing: true,
			scene: true,
		});
	}, preset);

test.describe("Default settings", () => {
	test.describe.configure({mode: "parallel"});

	test.beforeEach(async ({page}) => {
		await page.goto("test-cdn/index.html");
	});

	test("the default preset has the new look", async ({page}) => {
		await applyPreset(page, "default");
		expect(await page.evaluate(readOptions)).toEqual({
			...NEW_LOOK,
			hdr: true,
			toneMapping: "aces_filmic",
			// only the jewelry preset accumulates frames (SS-10508)
			accumulationFrames: 0,
			accumulationFramesMobile: 0,
			aoExcludeGems: [true],
			bloom: [],
		});
		expect(await page.evaluate(readMaximumRenderingSize)).toEqual({
			width: 2560,
			height: 1440,
		});
	});

	test("the jewelry preset has the new look", async ({page}) => {
		await applyPreset(page, "jewelry");
		expect(await page.evaluate(readOptions)).toEqual({
			...NEW_LOOK,
			environmentMapAnalyticDfg: true,
			hdr: true,
			toneMapping: "aces_filmic",
			accumulationFrames: 32,
			accumulationFramesMobile: 8,
			aoExcludeGems: [true],
			bloom: [{highlightsOnly: true, backgroundBloom: false}],
		});
		// AO only on the indirect light, so polished metal keeps its reflections
		expect(
			await page.evaluate(() =>
				(<typeof ShapeDiverViewer>(<any>window).SDV).viewports[
					"myViewport"
				].postProcessing
					.getPostProcessingEffectsArray()
					.filter((e) => e.type === "hbao")
					.map((e) => (<Record<string, unknown>>e.properties).mode),
			),
		).toEqual(["shading"]);
		expect(await page.evaluate(readMaximumRenderingSize)).toEqual({
			width: 2560,
			height: 1440,
		});
	});

	test("a viewport without a session keeps the old look", async ({page}) => {
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
		});
		expect(await page.evaluate(readOptions)).toMatchObject(OLD_LOOK);
		expect(await page.evaluate(readMaximumRenderingSize)).toEqual({
			width: 1920,
			height: 1080,
		});
	});

	test("a model with settings from before 7.2 keeps the old look", async ({
		page,
	}) => {
		await page.evaluate(async (ticket: string) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			const session = await SDV.createSession({
				id: "mySession",
				ticket,
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			});
			if (!session.hasStoredSettings)
				throw new Error("The test model has no stored settings.");
		}, shelfTicket);
		const options = await page.evaluate(readOptions);
		expect(options).toMatchObject(OLD_LOOK);
		expect(options.aoExcludeGems).not.toContain(true);
		expect(await page.evaluate(readMaximumRenderingSize)).toEqual({
			width: 1920,
			height: 1080,
		});
	});
});
