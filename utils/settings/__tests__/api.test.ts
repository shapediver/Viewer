import {Defaults as DefaultsV1} from "../src/versions/v1/Defaults";
import {Defaults as DefaultsV2} from "../src/versions/v2/Defaults";
import {Defaults as DefaultsV3} from "../src/versions/v3/Defaults";
import {Defaults as DefaultsV3_1} from "../src/versions/v3_1/Defaults";
import {Defaults as DefaultsV3_2} from "../src/versions/v3_2/Defaults";
import {Defaults as DefaultsV3_3} from "../src/versions/v3_3/Defaults";
import {Defaults as DefaultsV3_4} from "../src/versions/v3_4/Defaults";

import {convert, evaluateSettingsVersion, validate} from "../src/index";

describe("conversion", () => {
	it("convertFrom - equal 1", async () => {
		const defaultsV1 = DefaultsV1();
		const defaultsV2 = DefaultsV2();

		// settings v1 are different from settings v2, we therefore have to change the differences
		defaultsV1.cameraMovementDuration = 800;
		defaultsV1.rotateSpeed = 0.5;
		defaultsV1.zoomSpeed = 0.5;
		defaultsV1.showGrid = true;
		defaultsV1.showGroundPlane = true;
		defaultsV1.lightScenes = {};

		const converted = convert(defaultsV1, "2.0");
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV2),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV1 = DefaultsV1();
		const defaultsV2 = DefaultsV2();

		defaultsV1.ambientOcclusion = false;

		// settings v1 are different from settings v2, we therefore have to change the differences
		defaultsV1.cameraMovementDuration = 800;
		defaultsV1.rotateSpeed = 0.5;
		defaultsV1.zoomSpeed = 0.5;
		defaultsV1.showGrid = true;
		defaultsV1.showGroundPlane = true;
		defaultsV1.lightScenes = {};

		const converted = convert(defaultsV1, "2.0");
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV2),
		);
	});

	it("convertTo - equal", async () => {
		const defaultsV1 = DefaultsV1();
		const defaultsV2 = DefaultsV2();

		// settings v1 are different from settings v2, we therefore have to change the differences
		defaultsV2.viewer.scene.camera.cameraMovementDuration = 0;
		defaultsV2.viewer.scene.camera.controls.orbit.rotationSpeed = 0.25;
		defaultsV2.viewer.scene.camera.controls.orbit.zoomSpeed = 1.0;
		defaultsV2.viewer.scene.gridVisibility = false;
		defaultsV2.viewer.scene.groundPlaneVisibility = false;
		(<any>defaultsV2.viewer.scene.lights).lightScenes = null;

		const converted = convert(defaultsV2, "1.0");
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV1),
		);
	});

	it("convertTo - not equal", async () => {
		const defaultsV1 = DefaultsV1();
		const defaultsV2 = DefaultsV2();

		defaultsV2.viewer.scene.render.ambientOcclusion = false;

		// settings v1 are different from settings v2, we therefore have to change the differences
		defaultsV2.viewer.scene.camera.cameraMovementDuration = 0;
		defaultsV2.viewer.scene.camera.controls.orbit.rotationSpeed = 0.25;
		defaultsV2.viewer.scene.camera.controls.orbit.zoomSpeed = 1.0;
		defaultsV2.viewer.scene.gridVisibility = false;
		defaultsV2.viewer.scene.groundPlaneVisibility = false;
		(<any>defaultsV2.viewer.scene.lights).lightScenes = null;

		const converted = convert(defaultsV2, "1.0");
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV1),
		);
	});

	it("convertFrom - equal 2", async () => {
		const defaultsV2 = DefaultsV2();
		const defaultsV3 = DefaultsV3();

		// settings V2 are different from settings V3, we therefore have to change the differences
		defaultsV2.viewer.scene.material.environmentMap = "none";
		defaultsV2.viewer.scene.lights.lightScene = "";

		const converted = convert(defaultsV2, "3.0");

		// the default camera will be written into the cameras, to be conform with the default settings
		// we have to remove it
		(<any>converted).camera.cameraId = "";
		(<any>converted).camera.cameras = {};

		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV2 = DefaultsV2();
		const defaultsV3 = DefaultsV3();

		defaultsV2.viewer.scene.render.ambientOcclusion = false;

		// settings V2 are different from settings V3, we therefore have to change the differences

		const converted = convert(defaultsV2, "3.0");
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3),
		);
	});

	it("convertTo - equal", async () => {
		const defaultsV2 = DefaultsV2();
		const defaultsV3 = DefaultsV3();

		// settings V2 are different from settings V3, we therefore have to change the differences
		defaultsV2.viewer.scene.material.environmentMap = "none";

		const converted = convert(defaultsV3, "2.0");
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV2),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV2 = DefaultsV2();
		const defaultsV3 = DefaultsV3();

		defaultsV3.rendering.ambientOcclusion = false;

		// settings V2 are different from settings V3, we therefore have to change the differences

		const converted = convert(defaultsV3, "2.0");
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV2),
		);
	});

	it("convertFrom - equal 3", async () => {
		const defaultsV3 = DefaultsV3();
		const defaultsV3_1 = DefaultsV3_1();

		const converted = convert(defaultsV3, "3.1");
		defaultsV3_1.rendering.textureEncoding = "linear";
		defaultsV3_1.rendering.outputEncoding = "linear";
		defaultsV3_1.rendering.physicallyCorrectLights = false;
		defaultsV3_1.environment.map = "none";
		defaultsV3_1.environmentGeometry.groundPlaneColor = "#d3d3d3";
		defaultsV3_1.environmentGeometry.gridColor = "#ffffff";
		defaultsV3_1.rendering.ambientOcclusion = true;

		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3_1),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV3 = DefaultsV3();
		const defaultsV3_1 = DefaultsV3_1();

		defaultsV3.rendering.shadows = false;

		// settings V2 are different from settings V3, we therefore have to change the differences

		const converted = convert(defaultsV3, "3.1");
		defaultsV3_1.rendering.textureEncoding = "linear";
		defaultsV3_1.rendering.outputEncoding = "linear";
		defaultsV3_1.rendering.physicallyCorrectLights = false;
		defaultsV3_1.environment.map = "none";
		defaultsV3_1.environmentGeometry.groundPlaneColor = "#d3d3d3";
		defaultsV3_1.environmentGeometry.gridColor = "#ffffff";
		defaultsV3_1.rendering.ambientOcclusion = true;
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3_1),
		);
	});

	it("convertFrom - equal 3", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		const defaultsV3_2 = DefaultsV3_2();

		const converted = convert(defaultsV3_1, "3.2");
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3_2),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		const defaultsV3_2 = DefaultsV3_2();

		defaultsV3_1.rendering.shadows = false;
		const converted = convert(defaultsV3_1, "3.2");
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3_2),
		);
	});

	it("convertFrom - equal 3", async () => {
		const defaultsV3_2 = DefaultsV3_2();
		const defaultsV3_3 = DefaultsV3_3();

		const converted = convert(defaultsV3_2, "3.3");

		expect((<any>converted).rendering.automaticColorAdjustment).toBe(false);
		(<any>converted).rendering.automaticColorAdjustment = true;
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3_3),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV3_2 = DefaultsV3_2();
		const defaultsV3_3 = DefaultsV3_3();

		defaultsV3_2.rendering.shadows = false;
		const converted = convert(defaultsV3_2, "3.3");
		(<any>converted).rendering.automaticColorAdjustment = true;
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3_3),
		);
	});

	it("convertFrom - equal 3", async () => {
		const defaultsV3_3 = DefaultsV3_3();
		const defaultsV3_4 = DefaultsV3_4();

		const converted = convert(defaultsV3_3, "3.4");

		expect((<any>converted).environment.rotation).toStrictEqual({
			x: 0,
			y: 0,
			z: 0,
			w: 1,
		});
		(<any>converted).environment.rotation = {x: 0, y: 0, z: 0, w: 1};
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3_4),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV3_3 = DefaultsV3_3();
		const defaultsV3_4 = DefaultsV3_4();

		defaultsV3_3.rendering.shadows = false;
		const converted = convert(defaultsV3_3, "3.4");
		(<any>converted).environment.rotation = {x: 2, y: 0, z: 0, w: 1};
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3_4),
		);
	});

	it("convertFrom - equal 3", async () => {
		const defaultsV3_3 = DefaultsV3_3();
		const defaultsV3_4 = DefaultsV3_4();

		const converted = convert(defaultsV3_3, "3.4");

		expect((<any>converted).environment.blurriness).toBe(0);
		expect((<any>converted).environment.intensity).toBe(1);
		expect((<any>converted).general.defaultMaterialColor).toBe("#199b9bff");
		expect(JSON.stringify(converted)).toStrictEqual(
			JSON.stringify(defaultsV3_4),
		);
	});

	it("convertFrom - not equal", async () => {
		const defaultsV3_3 = DefaultsV3_3();
		const defaultsV3_4 = DefaultsV3_4();

		defaultsV3_3.rendering.shadows = false;
		const converted = convert(defaultsV3_3, "3.4");
		(<any>converted).environment.blurriness = 1;
		(<any>converted).environment.intensity = 0;
		(<any>converted).general.defaultMaterialColor = "#ff0000ff";
		expect(JSON.stringify(converted)).not.toStrictEqual(
			JSON.stringify(defaultsV3_4),
		);
	});
});

describe("evaluateSettingsVersion", () => {
	it("eval", async () => {
		const targetVersion1 = evaluateSettingsVersion(); // results in '1.0'
		expect(targetVersion1).toBe("1.0");
		const targetVersion2 = evaluateSettingsVersion("1.1000.0"); // results in '1.0'
		expect(targetVersion2).toBe("1.0");

		const targetVersion3 = evaluateSettingsVersion("2.2.0"); // results in '1.0'
		expect(targetVersion3).toBe("1.0");
		const targetVersion4 = evaluateSettingsVersion("2.17.0"); // results in '1.0'
		expect(targetVersion4).toBe("1.0");

		const targetVersion5 = evaluateSettingsVersion("2.18.0"); // results in '2.0'
		expect(targetVersion5).toBe("2.0");
		const targetVersion6 = evaluateSettingsVersion("2.19.0"); // results in '2.0'
		expect(targetVersion6).toBe("2.0");

		const targetVersion7 = evaluateSettingsVersion("3.1.1.0"); // results in '3.0'
		expect(targetVersion7).toBe("3.0");
		const targetVersion8 = evaluateSettingsVersion("3.0.1.0"); // results in '3.0'
		expect(targetVersion8).toBe("3.0");
		const targetVersion9 = evaluateSettingsVersion("3.1.9.0"); // results in '3.0'
		expect(targetVersion9).toBe("3.0");

		const targetVersion10 = evaluateSettingsVersion("3.1.11.16"); // results in '3.0'
		expect(targetVersion10).toBe("3.0");
		const targetVersion11 = evaluateSettingsVersion("3.1.12.0"); // results in '3.1'
		expect(targetVersion11).toBe("3.1");
		const targetVersion12 = evaluateSettingsVersion("3.1.12.8"); // results in '3.1'
		expect(targetVersion12).toBe("3.1");
		const targetVersion13 = evaluateSettingsVersion("3.1.14.8"); // results in '3.1'
		expect(targetVersion13).toBe("3.1");

		const targetVersion14 = evaluateSettingsVersion("3.2.5.1"); // results in '3.1'
		expect(targetVersion14).toBe("3.1");
		const targetVersion15 = evaluateSettingsVersion("3.2.6.0"); // results in '3.2'
		expect(targetVersion15).toBe("3.2");
		const targetVersion17 = evaluateSettingsVersion("3.2.6.1"); // results in '3.2'
		expect(targetVersion17).toBe("3.2");

		const targetVersion18 = evaluateSettingsVersion("3.2.7.0"); // results in '3.3'
		expect(targetVersion18).toBe("3.3");
		const targetVersion19 = evaluateSettingsVersion("3.2.7.2"); // results in '3.3'
		expect(targetVersion19).toBe("3.3");

		const targetVersion20 = evaluateSettingsVersion("3.2.8.3"); // results in '3.3'
		expect(targetVersion20).toBe("3.3");
		const targetVersion21 = evaluateSettingsVersion("3.2.9.0"); // results in '3.4'
		expect(targetVersion21).toBe("3.4");
		const targetVersion22 = evaluateSettingsVersion("3.2.9.2"); // results in '3.4'
		expect(targetVersion22).toBe("3.4");
		const targetVersion23 = evaluateSettingsVersion("3.2.10.2"); // results in '4.1'
		expect(targetVersion23).toBe("4.0");
		const targetVersion24 = evaluateSettingsVersion("3.2.11.2"); // results in '4.1'
		expect(targetVersion24).toBe("4.1");
		const targetVersion25 = evaluateSettingsVersion("3.2.10.0"); // results in '4.0'
		expect(targetVersion25).toBe("4.0");
		const targetVersion26 = evaluateSettingsVersion("3.2.11.0"); // results in '4.1'
		expect(targetVersion26).toBe("4.1");
		const targetVersion27 = evaluateSettingsVersion("3.2.12.0"); // results in '4.1'
		expect(targetVersion27).toBe("4.1");

		const targetVersion28 = evaluateSettingsVersion("3.3.0.0"); // results in '5.0'
		expect(targetVersion28).toBe("5.0");

		const targetVersion29 = evaluateSettingsVersion("3.3.8.0"); // results in '6.1'
		expect(targetVersion29).toBe("6.1");
		const targetVersion30 = evaluateSettingsVersion("3.3.11.0"); // results in '6.2'
		expect(targetVersion30).toBe("6.2");
		const targetVersion31 = evaluateSettingsVersion("3.3.12.0"); // results in '7.0'
		expect(targetVersion31).toBe("7.0");
		const targetVersion32 = evaluateSettingsVersion("3.3.15.8"); // results in '7.0'
		expect(targetVersion32).toBe("7.0");
		const targetVersion33 = evaluateSettingsVersion("3.3.16.0"); // results in '7.1'
		expect(targetVersion33).toBe("7.1");
	});
});

describe("validation", () => {
	it("validate - defaults", async () => {
		const defaultsV1 = DefaultsV1();
		expect(() => {
			validate(defaultsV1);
		}).not.toThrow();
	});

	it("validate - wrong defaults 1", async () => {
		const defaultsV1 = DefaultsV1();
		expect(() => {
			validate(defaultsV1, "2.0");
		}).toThrow();
	});

	it("validate - wrong defaults 2", async () => {
		const defaultsV1 = DefaultsV1();
		expect(() => {
			validate(defaultsV1, "3.0");
		}).toThrow();
	});

	it("validate - wrong defaults 3", async () => {
		const defaultsV2 = DefaultsV2();
		expect(() => {
			validate(defaultsV2, "1.0");
		}).toThrow();
	});

	it("validate - wrong defaults 4", async () => {
		const defaultsV2 = DefaultsV2();
		expect(() => {
			validate(defaultsV2, "3.0");
		}).toThrow();
	});

	it("validate - wrong defaults 5", async () => {
		const defaultsV3 = DefaultsV3();
		expect(() => {
			validate(defaultsV3, "1.0");
		}).toThrow();
	});

	it("validate - wrong defaults 6", async () => {
		const defaultsV3 = DefaultsV3();
		expect(() => {
			validate(defaultsV3, "2.0");
		}).toThrow();
	});

	it("validate - defaults", async () => {
		const defaultsV2 = DefaultsV2();
		expect(() => {
			validate(defaultsV2);
		}).not.toThrow();
	});

	it("validate - malicious", async () => {
		const defaultsV2 = DefaultsV2();
		(<any>defaultsV2).maliciousFunction = () => {
			console.log("I am bad!");
		};
		expect(() => {
			validate(defaultsV2);
		}).toThrow();
	});

	it("validate - missing", async () => {
		const defaultsV2 = DefaultsV2();
		delete (<any>defaultsV2.viewer.scene.render).ambientOcclusion;
		expect(() => {
			validate(defaultsV2);
		}).toThrow();
	});

	it("validate - wrong version", async () => {
		const defaultsV2 = DefaultsV2();
		expect(() => {
			validate(defaultsV2, "1.0");
		}).toThrow();
	});

	it("validate - defaults", async () => {
		const defaultsV3 = DefaultsV3();
		expect(() => {
			validate(defaultsV3);
		}).not.toThrow();
	});

	it("validate - defaults 2", async () => {
		const defaultsV3 = DefaultsV3();
		expect(() => {
			validate(defaultsV3, "3.0");
		}).not.toThrow();
	});

	it("validate - missing", async () => {
		const defaultsV3 = DefaultsV3();
		delete (<any>defaultsV3.rendering).ambientOcclusion;
		expect(() => {
			validate(defaultsV3);
		}).toThrow();
	});

	it("validate - real light scene", async () => {
		const defaultsV3 = DefaultsV3();
		(<any>defaultsV3.light).lightScenes = {
			default: {
				lights: {
					ambient0: {
						type: "ambient",
						order: 1,
						properties: {
							color: 0xffffff,
							intensity: 0.5,
						},
					},
					directional0: {
						type: "directional",
						order: 2,
						properties: {
							color: 0xffffff,
							intensity: 0.75,
							direction: {x: 0.5774, y: -0.5774, z: 0.5774},
							castShadow: true,
						},
					},
					directional1: {
						type: "directional",
						order: 3,
						properties: {
							color: 0xffffff,
							intensity: 0.35,
							direction: {x: -0.25, y: -1, z: 1},
							castShadow: false,
						},
					},
				},
			},
			legacy: {
				lights: {
					ambient0: {
						type: "ambient",
						order: 1,
						properties: {
							color: 0x646464, // rgb 100, 100, 100
							intensity: 1,
						},
					},
					directional0: {
						type: "directional",
						order: 2,
						properties: {
							color: 0xffffff,
							intensity: 1,
							castShadow: true,
							direction: {x: 0.5774, y: -0.5774, z: 0.5774},
						},
					},
				},
			},
		};
		expect(() => {
			validate(defaultsV3);
		}).not.toThrow();
	});
});
