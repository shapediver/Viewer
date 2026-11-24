import {
	convert,
	DefaultsV5,
	ISettingsV7_1,
	ISettingsV7_2,
	latestVersion,
	OLD_LOOK_V7_2,
	validate,
} from "../src";

const createSettingsV7_1 = (): ISettingsV7_1 => {
	const settings = <ISettingsV7_1>convert(DefaultsV5(), "7.1");
	settings.postprocessing.effects = [
		{type: "hbao", properties: {intensity: 2, radius: 0.5}},
		{type: "ssao", properties: {intensity: 1}},
		{type: "bloom", properties: {intensity: 1, mipmapBlur: true}},
	];
	return settings;
};

const createSettingsV7_2 = (): ISettingsV7_2 => {
	const settings = <ISettingsV7_2>convert(createSettingsV7_1(), "7.2");
	settings.postprocessing.effects = [
		{
			type: "hbao",
			properties: {
				intensity: 2,
				radius: 0.5,
				mode: "shading",
				specularOcclusion: "uniform",
				excludeGems: true,
			},
		},
		{
			type: "ssao",
			properties: {intensity: 1, mode: "composite", excludeGems: false},
		},
		{
			type: "bloom",
			properties: {
				intensity: 1,
				mipmapBlur: true,
				backgroundBloom: false,
				highlightsOnly: true,
			},
		},
	];
	return settings;
};

describe("settings V7.2", () => {
	it("latest version is 7.2", () => {
		expect(latestVersion).toBe("7.2");
	});

	it("old look values", () => {
		expect(OLD_LOOK_V7_2).toStrictEqual({
			hdr: false,
			backgroundBloom: true,
			highlightsOnly: false,
			excludeGems: false,
			mapPbrMode: "legacy",
			mapOrientation: "legacy",
			mapAnalyticDfg: false,
			physicalGemDispersion: false,
			physicalGemFresnel: false,
			gemLighting: "all",
			gemEnvironmentMapIntensity: 1,
			gemClampColor: true,
			gemTracing: "sphere",
			gemNormalMapResolution: 1024,
			accumulationFrames: 0,
			accumulationFramesMobile: 0,
			accumulationMode: "display",
			maximumRenderingSize: {width: 1920, height: 1080},
			maximumRenderingSizeMobile: {width: 1280, height: 720},
		});
	});

	it("validate - HBAO and SSAO mode", () => {
		const settings = createSettingsV7_2();
		expect(() => validate(settings, "7.2")).not.toThrow();
		expect(settings.postprocessing.effects[0].properties).toMatchObject({
			mode: "shading",
		});
		expect(settings.postprocessing.effects[1].properties).toMatchObject({
			mode: "composite",
		});
	});

	it("validate - mode is optional", () => {
		const settings = createSettingsV7_2();
		settings.postprocessing.effects = [
			{type: "hbao"},
			{type: "ssao", properties: {intensity: 1, excludeGems: false}},
		];
		expect(() => validate(settings, "7.2")).not.toThrow();
	});

	it("validate - bloom without properties is valid", () => {
		const settings = createSettingsV7_2();
		settings.postprocessing.effects = [{type: "bloom"}];
		expect(() => validate(settings, "7.2")).not.toThrow();
	});

	it("validate - bloom mipmapBlur is optional", () => {
		const settings = createSettingsV7_2();
		settings.postprocessing.effects = [
			{
				type: "bloom",
				properties: {backgroundBloom: false, highlightsOnly: true},
			},
		];
		expect(() => validate(settings, "7.2")).not.toThrow();
	});

	it("validate - bloom highlightLimit is an optional number", () => {
		const settings = createSettingsV7_2();
		expect(() => validate(settings, "7.2")).not.toThrow();
		(settings.postprocessing.effects[2].properties as any).highlightLimit =
			1;
		expect(() => validate(settings, "7.2")).not.toThrow();
		(settings.postprocessing.effects[2].properties as any).highlightLimit =
			"1";
		expect(() => validate(settings, "7.2")).toThrow();
	});

	it("convert 7.2 -> 7.1 -> 7.2 handles the bloom highlightLimit", () => {
		const settings = createSettingsV7_2();
		(settings.postprocessing.effects[2].properties as any).highlightLimit =
			1;

		const older = <ISettingsV7_1>convert(settings, "7.1");
		expect(older.postprocessing.effects[2].properties).not.toHaveProperty(
			"highlightLimit",
		);

		// settings saved by the Viewer with a 7.1 label keep the value
		(older.postprocessing.effects[2].properties as any).highlightLimit = 1;
		const newer = <ISettingsV7_2>convert(older, "7.2");
		expect(newer.postprocessing.effects[2].properties).toMatchObject({
			highlightLimit: 1,
		});
		expect(() => validate(newer, "7.2")).not.toThrow();
	});

	it("validate - invalid HBAO mode fails", () => {
		const settings = createSettingsV7_2();
		(settings.postprocessing.effects[0].properties as any).mode = "invalid";
		expect(() => validate(settings, "7.2")).toThrow();
	});

	it("validate - AO specularOcclusion", () => {
		const settings = createSettingsV7_2();
		(
			settings.postprocessing.effects[1].properties as any
		).specularOcclusion = "physical";
		expect(() => validate(settings, "7.2")).not.toThrow();
		(
			settings.postprocessing.effects[0].properties as any
		).specularOcclusion = "invalid";
		expect(() => validate(settings, "7.2")).toThrow();
	});

	it("validate - invalid SSAO mode fails", () => {
		const settings = createSettingsV7_2();
		(settings.postprocessing.effects[1].properties as any).mode = 1;
		expect(() => validate(settings, "7.2")).toThrow();
	});

	it("validate - missing new options fail", () => {
		const missing: ((s: ISettingsV7_2) => void)[] = [
			(s) => delete (s.postprocessing as any).hdr,
			(s) => delete (s.environment as any).mapPbrMode,
			(s) => delete (s.environment as any).mapOrientation,
			(s) => delete (s.environment as any).mapAnalyticDfg,
			(s) => delete (s.material as any).physicalGemDispersion,
			(s) => delete (s.material as any).physicalGemFresnel,
			(s) => delete (s.material as any).gemLighting,
			(s) => delete (s.material as any).gemEnvironmentMapIntensity,
			(s) => delete (s.material as any).gemClampColor,
			(s) => delete (s.material as any).gemTracing,
			(s) => delete (s.material as any).gemNormalMapResolution,
			(s) => delete (s.rendering as any).accumulationFrames,
			(s) => delete (s.rendering as any).accumulationFramesMobile,
			(s) => delete (s.rendering as any).accumulationMode,
			(s) => delete (s.rendering as any).maximumRenderingSize,
			(s) => delete (s.rendering as any).maximumRenderingSizeMobile,
			(s) =>
				delete (s.postprocessing.effects[0].properties as any)
					.excludeGems,
			(s) =>
				delete (s.postprocessing.effects[1].properties as any)
					.excludeGems,
			(s) =>
				delete (s.postprocessing.effects[2].properties as any)
					.backgroundBloom,
			(s) =>
				delete (s.postprocessing.effects[2].properties as any)
					.highlightsOnly,
		];
		missing.forEach((remove) => {
			const settings = createSettingsV7_2();
			remove(settings);
			expect(() => validate(settings, "7.2")).toThrow();
		});
	});

	it("validate - wrong types of new options fail", () => {
		const wrong: ((s: ISettingsV7_2) => void)[] = [
			(s) => ((s.postprocessing as any).hdr = "true"),
			(s) => ((s.environment as any).mapPbrMode = "other"),
			(s) => ((s.environment as any).mapPbrMode = true),
			(s) => ((s.environment as any).mapOrientation = "other"),
			(s) => ((s.environment as any).mapAnalyticDfg = "true"),
			(s) => ((s.material as any).physicalGemDispersion = "yes"),
			(s) => ((s.material as any).physicalGemFresnel = "yes"),
			(s) => ((s.material as any).gemLighting = 5),
			(s) => ((s.material as any).gemLighting = "yes"),
			(s) => ((s.material as any).gemEnvironmentMapIntensity = "1"),
			(s) => ((s.material as any).gemEnvironmentMapIntensity = -1),
			(s) => ((s.material as any).gemClampColor = "false"),
			(s) => ((s.material as any).gemTracing = "foo"),
			(s) => ((s.material as any).gemNormalMapResolution = 300),
			(s) => ((s.material as any).gemNormalMapResolution = "512"),
			(s) => ((s.rendering as any).accumulationFrames = "16"),
			(s) => ((s.rendering as any).accumulationFrames = -1),
			(s) => ((s.rendering as any).accumulationFramesMobile = 2.5),
			(s) => ((s.rendering as any).accumulationMode = "canvas"),
			(s) => ((s.rendering as any).accumulationMode = true),
			(s) => ((s.rendering as any).maximumRenderingSize = 1920),
			(s) => ((s.rendering as any).maximumRenderingSize = {width: 1920}),
			(s) =>
				(s.rendering.maximumRenderingSize = {width: 0, height: 1080}),
			(s) =>
				(s.rendering.maximumRenderingSizeMobile = {
					width: 1280.5,
					height: 720,
				}),
			(s) =>
				((s.postprocessing.effects[0].properties as any).excludeGems =
					"yes"),
			(s) =>
				((s.postprocessing.effects[1].properties as any).excludeGems =
					1),
			(s) =>
				((s.postprocessing.effects[2].properties as any).mipmapBlur =
					"yes"),
			(s) =>
				((
					s.postprocessing.effects[2].properties as any
				).backgroundBloom = "no"),
			(s) =>
				((
					s.postprocessing.effects[2].properties as any
				).highlightsOnly = 0),
		];
		wrong.forEach((change) => {
			const settings = createSettingsV7_2();
			change(settings);
			expect(() => validate(settings, "7.2")).toThrow();
		});
	});

	it("convert 7.1 -> 7.2 writes the old look", () => {
		const settingsV7_1 = createSettingsV7_1();
		const before = JSON.stringify(settingsV7_1);

		const converted = <ISettingsV7_2>convert(settingsV7_1, "7.2");

		expect(converted.settings_version).toBe("7.2");
		expect(converted.postprocessing.hdr).toBe(false);
		expect(converted.environment.mapPbrMode).toBe("legacy");
		expect(converted.environment.mapOrientation).toBe("legacy");
		expect(converted.environment.mapAnalyticDfg).toBe(false);
		expect(converted.material.physicalGemDispersion).toBe(false);
		expect(converted.material.physicalGemFresnel).toBe(false);
		expect(converted.material.gemLighting).toBe("all");
		expect(converted.material.gemEnvironmentMapIntensity).toBe(1);
		expect(converted.material.gemClampColor).toBe(true);
		expect(converted.material.gemTracing).toBe("sphere");
		expect(converted.material.gemNormalMapResolution).toBe(1024);
		expect(converted.rendering.accumulationFrames).toBe(0);
		expect(converted.rendering.accumulationFramesMobile).toBe(0);
		expect(converted.rendering.accumulationMode).toBe("display");
		expect(converted.rendering.maximumRenderingSize).toStrictEqual({
			width: 1920,
			height: 1080,
		});
		expect(converted.rendering.maximumRenderingSizeMobile).toStrictEqual({
			width: 1280,
			height: 720,
		});
		// the converted object does not share the constant
		expect(converted.rendering.maximumRenderingSize).not.toBe(
			OLD_LOOK_V7_2.maximumRenderingSize,
		);
		expect(converted.postprocessing.effects).toStrictEqual([
			{
				type: "hbao",
				properties: {intensity: 2, radius: 0.5, excludeGems: false},
			},
			{type: "ssao", properties: {intensity: 1, excludeGems: false}},
			{
				type: "bloom",
				properties: {
					intensity: 1,
					mipmapBlur: true,
					backgroundBloom: true,
					highlightsOnly: false,
				},
			},
		]);
		expect(() => validate(converted, "7.2")).not.toThrow();
		// the input must not be changed
		expect(JSON.stringify(settingsV7_1)).toBe(before);
	});

	it("convert 7.1 -> 7.2 keeps values the 7.1 object already carries", () => {
		const settingsV7_1: any = createSettingsV7_1();
		settingsV7_1.postprocessing.hdr = true;
		settingsV7_1.environment.mapPbrMode = "modern";
		settingsV7_1.environment.mapAnalyticDfg = true;
		settingsV7_1.material.physicalGemDispersion = true;
		settingsV7_1.material.physicalGemFresnel = true;
		settingsV7_1.material.gemLighting = "environment";
		settingsV7_1.material.gemEnvironmentMapIntensity = 1.5;
		settingsV7_1.material.gemClampColor = false;
		settingsV7_1.material.gemTracing = "facets";
		settingsV7_1.material.gemNormalMapResolution = 512;
		settingsV7_1.rendering.accumulationFrames = 16;
		settingsV7_1.rendering.accumulationMode = "hdr";
		settingsV7_1.rendering.maximumRenderingSize = {
			width: 3840,
			height: 2160,
		};
		settingsV7_1.postprocessing.effects = [
			{type: "hbao", properties: {intensity: 2, excludeGems: true}},
			{
				type: "bloom",
				properties: {
					intensity: 1,
					mipmapBlur: true,
					backgroundBloom: false,
					highlightsOnly: true,
				},
			},
		];
		const before = JSON.stringify(settingsV7_1);

		const converted = <ISettingsV7_2>convert(settingsV7_1, "7.2");

		expect(converted.postprocessing.hdr).toBe(true);
		expect(converted.environment.mapPbrMode).toBe("modern");
		expect(converted.environment.mapOrientation).toBe("legacy");
		expect(converted.environment.mapAnalyticDfg).toBe(true);
		expect(converted.material.physicalGemDispersion).toBe(true);
		expect(converted.material.physicalGemFresnel).toBe(true);
		expect(converted.material.gemLighting).toBe("environment");
		expect(converted.material.gemEnvironmentMapIntensity).toBe(1.5);
		expect(converted.material.gemClampColor).toBe(false);
		expect(converted.material.gemTracing).toBe("facets");
		expect(converted.material.gemNormalMapResolution).toBe(512);
		expect(converted.rendering.accumulationFrames).toBe(16);
		expect(converted.rendering.accumulationFramesMobile).toBe(0);
		expect(converted.rendering.accumulationMode).toBe("hdr");
		expect(converted.rendering.maximumRenderingSize).toStrictEqual({
			width: 3840,
			height: 2160,
		});
		expect(converted.rendering.maximumRenderingSizeMobile).toStrictEqual({
			width: 1280,
			height: 720,
		});
		expect(converted.postprocessing.effects).toStrictEqual([
			{type: "hbao", properties: {intensity: 2, excludeGems: true}},
			{
				type: "bloom",
				properties: {
					intensity: 1,
					mipmapBlur: true,
					backgroundBloom: false,
					highlightsOnly: true,
				},
			},
		]);
		expect(() => validate(converted, "7.2")).not.toThrow();
		expect(JSON.stringify(settingsV7_1)).toBe(before);
	});

	it("convert 7.1 -> 7.2 leaves effects without properties alone", () => {
		const settingsV7_1 = createSettingsV7_1();
		settingsV7_1.postprocessing.effects = [
			{type: "bloom"},
			{type: "hbao"},
			{type: "ssao"},
			{type: "vignette", properties: {offset: 0.5}},
		];
		const before = JSON.stringify(settingsV7_1);

		const converted = <ISettingsV7_2>convert(settingsV7_1, "7.2");

		expect(converted.postprocessing.effects).toStrictEqual(
			settingsV7_1.postprocessing.effects,
		);
		expect(() => validate(converted, "7.2")).not.toThrow();
		expect(JSON.stringify(settingsV7_1)).toBe(before);
	});

	it("convert 7.2 -> 7.1 drops the new options", () => {
		const settingsV7_2 = createSettingsV7_2();
		const before = JSON.stringify(settingsV7_2);

		const converted = <ISettingsV7_1>convert(settingsV7_2, "7.1");

		expect(converted.settings_version).toBe("7.1");
		expect(converted.postprocessing.effects).toStrictEqual([
			{type: "hbao", properties: {intensity: 2, radius: 0.5}},
			{type: "ssao", properties: {intensity: 1}},
			{type: "bloom", properties: {intensity: 1, mipmapBlur: true}},
		]);
		expect(converted.postprocessing).not.toHaveProperty("hdr");
		expect(converted.environment).not.toHaveProperty("mapPbrMode");
		expect(converted.environment).not.toHaveProperty("mapOrientation");
		expect(converted.environment).not.toHaveProperty("mapAnalyticDfg");
		expect(converted.material).not.toHaveProperty("physicalGemDispersion");
		expect(converted.material).not.toHaveProperty("physicalGemFresnel");
		expect(converted.material).not.toHaveProperty("gemLighting");
		expect(converted.material).not.toHaveProperty(
			"gemEnvironmentMapIntensity",
		);
		expect(converted.material).not.toHaveProperty("gemClampColor");
		expect(converted.material).not.toHaveProperty("gemTracing");
		expect(converted.material).not.toHaveProperty("gemNormalMapResolution");
		expect(converted.rendering).not.toHaveProperty("accumulationFrames");
		expect(converted.rendering).not.toHaveProperty(
			"accumulationFramesMobile",
		);
		expect(converted.rendering).not.toHaveProperty("accumulationMode");
		expect(converted.rendering).not.toHaveProperty("maximumRenderingSize");
		expect(converted.rendering).not.toHaveProperty(
			"maximumRenderingSizeMobile",
		);
		expect(() => validate(converted, "7.1")).not.toThrow();
		// the input must not be changed
		expect(JSON.stringify(settingsV7_2)).toBe(before);
		expect(settingsV7_2.postprocessing.effects[0].properties).toMatchObject(
			{mode: "shading", excludeGems: true},
		);
	});

	it("validate - SSR effect", () => {
		const settings = createSettingsV7_2();
		settings.postprocessing.effects.push(
			{type: "ssr"},
			{
				type: "ssr",
				properties: {
					intensity: 1,
					maxRoughness: 0.3,
					steps: 16,
					distance: 2,
					thickness: 0.1,
					enableOnMobile: false,
				},
			},
		);
		expect(() => validate(settings, "7.2")).not.toThrow();
	});

	it("validate - invalid SSR properties fail", () => {
		const invalid: unknown[] = [
			{steps: 0},
			{steps: 65},
			{steps: 1.5},
			{intensity: -1},
			{enableOnMobile: "yes"},
			{unknownProperty: 1},
		];
		for (const properties of invalid) {
			const settings = createSettingsV7_2();
			settings.postprocessing.effects.push({
				type: "ssr",
				properties: properties as {steps?: number},
			});
			expect(() => validate(settings, "7.2")).toThrow();
		}
	});

	it("convert 7.2 -> 7.1 drops the SSR effect", () => {
		const settingsV7_2 = createSettingsV7_2();
		settingsV7_2.postprocessing.effects.splice(1, 0, {
			type: "ssr",
			properties: {intensity: 0.5},
		});

		const converted = <ISettingsV7_1>convert(settingsV7_2, "7.1");

		expect(converted.postprocessing.effects.map((e) => e.type)).toEqual([
			"hbao",
			"ssao",
			"bloom",
		]);
		expect(() => validate(converted, "7.1")).not.toThrow();
		expect(settingsV7_2.postprocessing.effects[1].type).toBe("ssr");
	});

	it("convert 7.2 -> 7.1 fills mipmapBlur of bloom", () => {
		const settingsV7_2 = createSettingsV7_2();
		settingsV7_2.postprocessing.effects = [
			{
				type: "bloom",
				properties: {
					intensity: 1,
					mipmapBlur: undefined,
					backgroundBloom: false,
					highlightsOnly: true,
				},
			},
		];
		const settingsV7_2Json = <ISettingsV7_2>(
			JSON.parse(JSON.stringify(settingsV7_2))
		);
		expect(() => validate(settingsV7_2Json, "7.2")).not.toThrow();

		const converted = <ISettingsV7_1>convert(settingsV7_2Json, "7.1");

		expect(converted.postprocessing.effects).toStrictEqual([
			{type: "bloom", properties: {intensity: 1, mipmapBlur: false}},
		]);
		expect(() => validate(converted, "7.1")).not.toThrow();
	});

	it("convert 7.0 -> 7.2 and back", () => {
		const settingsV7_0 = convert(DefaultsV5(), "7.0");
		const converted = <ISettingsV7_2>convert(settingsV7_0, "7.2");
		expect(converted.settings_version).toBe("7.2");
		expect(() => validate(converted, "7.2")).not.toThrow();
		const back = convert(converted, "7.0");
		expect(back.settings_version).toBe("7.0");
		expect(() => validate(back, "7.0")).not.toThrow();
	});

	it("a 7.2 object with new-look values survives conversion unchanged", () => {
		const settings = createSettingsV7_2();
		settings.postprocessing.hdr = true;
		settings.rendering.toneMapping = "AgX";
		settings.environment.mapPbrMode = "modern";
		settings.environment.mapOrientation = "threejs";
		settings.environment.mapAnalyticDfg = true;
		settings.rendering.accumulationFrames = 16;
		settings.rendering.accumulationFramesMobile = 8;
		settings.rendering.accumulationMode = "hdr";
		settings.rendering.maximumRenderingSize = {width: 2560, height: 1440};
		settings.rendering.maximumRenderingSizeMobile = {
			width: 960,
			height: 540,
		};
		const roundTripped = <ISettingsV7_2>(
			JSON.parse(JSON.stringify(settings))
		);

		const converted = <ISettingsV7_2>convert(roundTripped, "7.2");

		expect(() => validate(converted, "7.2")).not.toThrow();
		expect(converted).toStrictEqual(roundTripped);
		expect(converted.postprocessing.hdr).toBe(true);
		expect(converted.rendering.toneMapping).toBe("AgX");
		expect(converted.environment.mapPbrMode).toBe("modern");
		expect(converted.environment.mapOrientation).toBe("threejs");
		expect(converted.environment.mapAnalyticDfg).toBe(true);
		expect(converted.rendering.accumulationFrames).toBe(16);
		expect(converted.rendering.accumulationFramesMobile).toBe(8);
		expect(converted.rendering.maximumRenderingSize).toStrictEqual({
			width: 2560,
			height: 1440,
		});
		expect(converted.rendering.maximumRenderingSizeMobile).toStrictEqual({
			width: 960,
			height: 540,
		});
		expect(converted.postprocessing.effects[0].properties).toMatchObject({
			mode: "shading",
			excludeGems: true,
		});
		expect(converted.postprocessing.effects[2].properties).toMatchObject({
			backgroundBloom: false,
			highlightsOnly: true,
		});
	});
});
