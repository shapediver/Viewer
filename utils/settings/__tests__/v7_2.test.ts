import {
	convert,
	DefaultsV5,
	ISettingsV7_1,
	ISettingsV7_2,
	latestVersion,
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
			properties: {intensity: 2, radius: 0.5, mode: "shading"},
		},
		{type: "ssao", properties: {intensity: 1, mode: "composite"}},
		{type: "bloom", properties: {intensity: 1, mipmapBlur: true}},
	];
	return settings;
};

describe("settings V7.2", () => {
	it("latest version is 7.2", () => {
		expect(latestVersion).toBe("7.2");
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
			{type: "ssao", properties: {intensity: 1}},
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

	it("convert 7.1 -> 7.2", () => {
		const settingsV7_1 = createSettingsV7_1();
		const before = JSON.stringify(settingsV7_1);

		const converted = <ISettingsV7_2>convert(settingsV7_1, "7.2");

		expect(converted.settings_version).toBe("7.2");
		expect(converted.postprocessing.effects).toStrictEqual(
			settingsV7_1.postprocessing.effects,
		);
		expect(() => validate(converted, "7.2")).not.toThrow();
		// the input must not be changed
		expect(JSON.stringify(settingsV7_1)).toBe(before);
	});

	it("convert 7.2 -> 7.1 drops mode", () => {
		const settingsV7_2 = createSettingsV7_2();
		const before = JSON.stringify(settingsV7_2);

		const converted = <ISettingsV7_1>convert(settingsV7_2, "7.1");

		expect(converted.settings_version).toBe("7.1");
		expect(converted.postprocessing.effects).toStrictEqual([
			{type: "hbao", properties: {intensity: 2, radius: 0.5}},
			{type: "ssao", properties: {intensity: 1}},
			{type: "bloom", properties: {intensity: 1, mipmapBlur: true}},
		]);
		expect(() => validate(converted, "7.1")).not.toThrow();
		// the input must not be changed
		expect(JSON.stringify(settingsV7_2)).toBe(before);
		expect(settingsV7_2.postprocessing.effects[0].properties).toMatchObject(
			{mode: "shading"},
		);
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
});
