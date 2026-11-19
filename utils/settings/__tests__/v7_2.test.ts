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

	it("validate - invalid HBAO mode fails", () => {
		const settings = createSettingsV7_2();
		(settings.postprocessing.effects[0].properties as any).mode = "invalid";
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
		expect(() => validate(converted, "7.1")).not.toThrow();
		// the input must not be changed
		expect(JSON.stringify(settingsV7_2)).toBe(before);
		expect(settingsV7_2.postprocessing.effects[0].properties).toMatchObject(
			{mode: "shading", excludeGems: true},
		);
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
