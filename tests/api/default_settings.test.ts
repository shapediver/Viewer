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
		physicalGemDispersion: viewport.physicalGemDispersion,
		physicalGemFresnel: viewport.physicalGemFresnel,
		gemEnvironmentMapIntensity: viewport.gemEnvironmentMapIntensity,
		gemTracing: viewport.gemTracing,
		gemNormalMapResolution: viewport.gemNormalMapResolution,
		toneMapping: viewport.toneMapping,
		aoExcludeGems: [...properties("ssao"), ...properties("hbao")].map(
			(p) => p.excludeGems === true,
		),
		bloom: properties("bloom").map((p) => ({
			highlightsOnly: p.highlightsOnly,
			backgroundBloom: p.backgroundBloom,
		})),
	};
};

const OLD_LOOK = {
	hdr: false,
	environmentMapPbrMode: "legacy",
	environmentMapOrientation: "legacy",
	physicalGemDispersion: false,
	physicalGemFresnel: false,
	gemEnvironmentMapIntensity: 1,
	gemTracing: "sphere",
	gemNormalMapResolution: 1024,
};

const NEW_LOOK = {
	environmentMapPbrMode: "modern",
	environmentMapOrientation: "threejs",
	physicalGemDispersion: true,
	physicalGemFresnel: false,
	gemEnvironmentMapIntensity: 1,
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
			aoExcludeGems: [true],
			bloom: [],
		});
	});

	test("the jewelry preset has the new look", async ({page}) => {
		await applyPreset(page, "jewelry");
		expect(await page.evaluate(readOptions)).toEqual({
			...NEW_LOOK,
			hdr: true,
			toneMapping: "neutral",
			aoExcludeGems: [true],
			bloom: [{highlightsOnly: true, backgroundBloom: false}],
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
	});
});
