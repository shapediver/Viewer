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
		environmentMapFiltering: viewport.environmentMapFiltering,
		environmentMapSquaredRoughnessBend:
			viewport.environmentMapSquaredRoughnessBend,
		physicalGemDispersion: viewport.physicalGemDispersion,
		physicalGemFresnel: viewport.physicalGemFresnel,
		gemLighting: viewport.gemLighting,
		gemEnvironmentMapIntensity: viewport.gemEnvironmentMapIntensity,
		gemClampColor: viewport.gemClampColor,
		gemTracing: viewport.gemTracing,
		gemNormalMapResolution: viewport.gemNormalMapResolution,
		toneMapping: viewport.toneMapping,
		accumulationFrames: viewport.accumulationFrames,
		accumulationFramesMobile: viewport.accumulationFramesMobile,
		accumulationMode: viewport.accumulationMode,
		ambientOcclusionWhileMoving: viewport.ambientOcclusionWhileMoving,
		softShadowsWhileMoving: viewport.softShadowsWhileMoving,
		aoExcludeGems: [...properties("ssao"), ...properties("hbao")].map(
			(p) => p.excludeGems === true,
		),
		bloom: properties("bloom").map((p) => ({
			highlightsOnly: p.highlightsOnly,
			backgroundBloom: p.backgroundBloom,
			filter: p.filter,
		})),
		// screen-space reflections, only in the jewelry preset (SS-10509)
		ssr: properties("ssr").map((p) => ({
			enableOnMobile: p.enableOnMobile === true,
			// weighted and combined like the reference renderer (SS-10654)
			compositing: p.compositing ?? "radiance",
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
	environmentMapFiltering: "ggx",
	environmentMapSquaredRoughnessBend: false,
	physicalGemDispersion: false,
	physicalGemFresnel: false,
	gemLighting: "all",
	gemEnvironmentMapIntensity: 1,
	gemClampColor: true,
	gemTracing: "sphere",
	gemNormalMapResolution: 1024,
	accumulationFrames: 0,
	accumulationFramesMobile: 0,
	ssr: [],
	accumulationMode: "display",
	ambientOcclusionWhileMoving: true,
	softShadowsWhileMoving: true,
};

const NEW_LOOK = {
	// no preset leaves the effects out while the camera moves (SS-10553)
	ambientOcclusionWhileMoving: true,
	softShadowsWhileMoving: true,
	environmentMapPbrMode: "modern",
	environmentMapOrientation: "threejs",
	// only the jewelry preset uses the analytic DFG
	environmentMapAnalyticDfg: false,
	// only the jewelry preset uses the Gaussian prefiltering (SS-10626)
	environmentMapFiltering: "ggx",
	// only the jewelry preset uses the roughness² bend (SS-10627)
	environmentMapSquaredRoughnessBend: false,
	physicalGemDispersion: true,
	physicalGemFresnel: true,
	gemLighting: "environment",
	gemEnvironmentMapIntensity: 1.2,
	gemClampColor: false,
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
			// only the jewelry preset averages in HDR (SS-10607)
			accumulationMode: "display",
			aoExcludeGems: [true],
			bloom: [],
			ssr: [],
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
			environmentMapFiltering: "gaussian",
			environmentMapSquaredRoughnessBend: true,
			hdr: true,
			toneMapping: "aces_filmic",
			accumulationFrames: 32,
			accumulationFramesMobile: 8,
			accumulationMode: "hdr",
			aoExcludeGems: [true],
			// the bloom algorithm of the reference renderer (SS-10655)
			bloom: [
				{
					highlightsOnly: true,
					backgroundBloom: false,
					filter: "dualFilter",
				},
			],
			// on desktop only
			ssr: [{enableOnMobile: false, compositing: "specular"}],
		});
		// SSAO inside the shading, darkening the reflections by the AO itself
		// (SS-10601), so polished metal keeps its highlights
		expect(
			await page.evaluate(() =>
				(<typeof ShapeDiverViewer>(<any>window).SDV).viewports[
					"myViewport"
				].postProcessing
					.getPostProcessingEffectsArray()
					.filter((e) => e.type === "ssao" || e.type === "hbao")
					.map((e) => {
						const p = <Record<string, unknown>>e.properties;
						return [
							e.type,
							p.mode,
							p.specularOcclusion,
							p.algorithm,
						];
					}),
			),
		).toEqual([["ssao", "shading", "physical", "sao"]]);
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

	test("ambientOcclusionWhileMoving and softShadowsWhileMoving survive saving and applying the settings", async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const source = await SDV.createViewport({
				id: "source",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			source.ambientOcclusionWhileMoving = false;
			source.softShadowsWhileMoving = false;
			const settings: any = source.getViewportSettings();
			const stored = {
				ambientOcclusionWhileMoving:
					settings.rendering.ambientOcclusionWhileMoving,
				softShadowsWhileMoving:
					settings.rendering.softShadowsWhileMoving,
			};
			await source.close();
			const target = await SDV.createViewport({
				id: "myViewport",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			// TODO: drop once the @shapediver/viewer.settings pin includes settings 7.2
			settings.settings_version = "7.1";
			await target.applyViewportSettings(settings, {
				ar: true,
				camera: true,
				environment: true,
				general: true,
				light: true,
				postprocessing: true,
				scene: true,
			});
			return {
				stored,
				applied: {
					ambientOcclusionWhileMoving:
						target.ambientOcclusionWhileMoving,
					softShadowsWhileMoving: target.softShadowsWhileMoving,
				},
			};
		});
		const off = {
			ambientOcclusionWhileMoving: false,
			softShadowsWhileMoving: false,
		};
		expect(result).toEqual({stored: off, applied: off});
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
