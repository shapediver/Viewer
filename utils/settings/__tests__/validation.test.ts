import {Defaults as DefaultsV1} from "../src/versions/v1/Defaults";
import {Defaults as DefaultsV2} from "../src/versions/v2/Defaults";
import {Defaults as DefaultsV3} from "../src/versions/v3/Defaults";
import {Defaults as DefaultsV3_1} from "../src/versions/v3_1/Defaults";

import {validate} from "../src";
import {validate as validateV1} from "../src/versions/v1/Validator";
import {validate as validateV2} from "../src/versions/v2/Validator";
import {validate as validateV3} from "../src/versions/v3/Validator";
import {validate as validateV3_1} from "../src/versions/v3_1/Validator";

describe("validationV1", () => {
	it("validate - defaults", async () => {
		const defaultsV1 = DefaultsV1();
		expect(() => {
			validateV1(defaultsV1);
		}).not.toThrowError();
	});
});

describe("validationV2", () => {
	it("validate - defaults", async () => {
		const defaultsV2 = DefaultsV2();
		expect(() => {
			validateV2(defaultsV2);
		}).not.toThrowError();
	});

	it("validate - empty", async () => {
		expect(() => {
			validateV2({});
		}).toThrowError();
	});

	it("validate - malicious", async () => {
		const defaultsV2 = DefaultsV2();
		(<any>defaultsV2).maliciousFunction = () => {
			console.log("I am bad!");
		};
		expect(() => {
			validateV2(defaultsV2);
		}).toThrowError();
	});

	it("validate - missing", async () => {
		const defaultsV2 = DefaultsV2();
		delete (<any>defaultsV2.viewer.scene.render).ambientOcclusion;
		expect(() => {
			validateV2(defaultsV2);
		}).toThrowError();
	});

	it("validate - real light scene", async () => {
		const defaultsV2 = DefaultsV2();
		(<any>defaultsV2.viewer.scene.lights).lightScenes = {
			default: {
				id: "default",
				lights: {
					ambient0: {
						id: "ambient0",
						type: "ambient",
						properties: {
							color: 0xffffff,
							intensity: 0.5,
						},
					},
					directional0: {
						id: "directional0",
						type: "directional",
						properties: {
							color: 0xffffff,
							intensity: 0.75,
							direction: {x: 0.5774, y: -0.5774, z: 0.5774},
							castShadow: true,
						},
					},
					directional1: {
						id: "directional1",
						type: "directional",
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
				id: "legacy",
				lights: {
					ambient0: {
						id: "ambient0",
						type: "ambient",
						properties: {
							color: 0x646464, // rgb 100, 100, 100
							intensity: 1,
						},
					},
					directional0: {
						id: "directional0",
						type: "directional",
						properties: {
							color: 0xffffff,
							intensity: 1,
							castShadow: true,
							direction: {x: 0.5774, y: -0.5774, z: 0.5774},
						},
					},
					flash: {
						id: "flash0",
						type: "flash",
						properties: {
							color: 0xffffff,
							intensity: 0.4,
							distance: 0,
							angle: Math.PI / 2,
							penumbra: 5,
							decay: 5,
						},
					},
				},
			},
		};
		expect(() => {
			validateV2(defaultsV2);
		}).not.toThrowError();
	});
});

describe("validationV3", () => {
	it("validate - defaults", async () => {
		const defaultsV3 = DefaultsV3();
		expect(() => {
			validateV3(defaultsV3);
		}).not.toThrowError();
	});

	it("validate - empty", async () => {
		expect(() => {
			validateV3({});
		}).toThrowError();
	});

	it("validate - malicious", async () => {
		const defaultsV3 = DefaultsV3();
		(<any>defaultsV3).maliciousFunction = () => {
			console.log("I am bad!");
		};
		expect(() => {
			validateV3(defaultsV3);
		}).toThrowError();
	});

	it("validate - missing", async () => {
		const defaultsV3 = DefaultsV3();
		delete (<any>defaultsV3.rendering).ambientOcclusion;
		expect(() => {
			validateV3(defaultsV3);
		}).toThrowError();
	});

	it("validate - real cameras", async () => {
		const defaultsV3 = DefaultsV3();
		(<any>defaultsV3.camera).cameras = {
			"e6c08e7f-b2ef-474f-9bba-31821e272535": {
				autoAdjust: false,
				cameraMovementDuration: 0,
				controls: {
					autoRotationSpeed: 0,
					damping: 0.1,
					enableAutoRotation: false,
					enableKeyPan: false,
					enablePan: true,
					enableRotation: true,
					enableZoom: true,
					input: {
						keys: {up: 38, down: 40, left: 37, right: 39},
						mouse: {rotate: 0, zoom: 1, pan: 2},
						touch: {rotate: 1, zoom: 2, pan: 3},
					},
					keyPanSpeed: 0,
					movementSmoothness: 0.5,
					panSpeed: 0.5,
					restrictions: {
						position: {
							cube: {
								max: {x: null, y: null, z: null},
								min: {x: null, y: null, z: null},
							},
							sphere: {
								center: {x: 0, y: 0, z: 0},
								radius: null,
							},
						},
						target: {
							cube: {
								max: {x: null, y: null, z: null},
								min: {x: null, y: null, z: null},
							},
							sphere: {
								center: {x: 0, y: 0, z: 0},
								radius: null,
							},
						},
						rotation: {
							maxAzimuthAngle: null,
							maxPolarAngle: 180,
							minAzimuthAngle: null,
							minPolarAngle: 0,
						},
						zoom: {
							maxDistance: null,
							minDistance: 0,
						},
					},
					rotationSpeed: 0.25,
					zoomSpeed: 1,
				},
				enableCameraControls: true,
				fov: 45,
				position: {
					x: 58.03696060180664,
					y: -290.11590576171875,
					z: 87.67756652832031,
				},
				revertAtMouseUp: false,
				revertAtMouseUpDuration: 800,
				target: {x: 0, y: 7, z: -3.25},
				type: "perspective",
				zoomExtentsFactor: 1,
			},
		};
		expect(() => {
			validateV3(defaultsV3);
		}).not.toThrowError();
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
			validateV3(defaultsV3);
		}).not.toThrowError();
	});
});

describe("validationV3.1", () => {
	it("validate - defaults", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		expect(() => {
			validateV3_1(defaultsV3_1);
		}).not.toThrowError();
	});

	it("validate - empty", async () => {
		expect(() => {
			validateV3_1({});
		}).toThrowError();
	});

	it("validate - malicious", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		(<any>defaultsV3_1).maliciousFunction = () => {
			console.log("I am bad!");
		};
		expect(() => {
			validateV3_1(defaultsV3_1);
		}).toThrowError();
	});

	it("validate - missing", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		delete (<any>defaultsV3_1.rendering).ambientOcclusion;
		expect(() => {
			validateV3_1(defaultsV3_1);
		}).toThrowError();
	});

	it("validate - real cameras", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		(<any>defaultsV3_1.camera).cameras = {
			"e6c08e7f-b2ef-474f-9bba-31821e272535": {
				autoAdjust: false,
				cameraMovementDuration: 0,
				controls: {
					autoRotationSpeed: 0,
					damping: 0.1,
					enableAutoRotation: false,
					enableKeyPan: false,
					enablePan: true,
					enableRotation: true,
					enableZoom: true,
					input: {
						keys: {up: 38, down: 40, left: 37, right: 39},
						mouse: {rotate: 0, zoom: 1, pan: 2},
						touch: {rotate: 1, zoom: 2, pan: 3},
					},
					keyPanSpeed: 0,
					movementSmoothness: 0.5,
					panSpeed: 0.5,
					restrictions: {
						position: {
							cube: {
								max: {x: null, y: null, z: null},
								min: {x: null, y: null, z: null},
							},
							sphere: {
								center: {x: 0, y: 0, z: 0},
								radius: null,
							},
						},
						target: {
							cube: {
								max: {x: null, y: null, z: null},
								min: {x: null, y: null, z: null},
							},
							sphere: {
								center: {x: 0, y: 0, z: 0},
								radius: null,
							},
						},
						rotation: {
							maxAzimuthAngle: null,
							maxPolarAngle: 180,
							minAzimuthAngle: null,
							minPolarAngle: 0,
						},
						zoom: {
							maxDistance: null,
							minDistance: 0,
						},
					},
					rotationSpeed: 0.25,
					zoomSpeed: 1,
				},
				enableCameraControls: true,
				fov: 45,
				position: {
					x: 58.03696060180664,
					y: -290.11590576171875,
					z: 87.67756652832031,
				},
				revertAtMouseUp: false,
				revertAtMouseUpDuration: 800,
				target: {x: 0, y: 7, z: -3.25},
				type: "perspective",
				zoomExtentsFactor: 1,
			},
		};
		expect(() => {
			validateV3_1(defaultsV3_1);
		}).not.toThrowError();
	});

	it("validate - real light scene", async () => {
		const defaultsV3_1 = DefaultsV3_1();
		(<any>defaultsV3_1.light).lightScenes = {
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
			validateV3_1(defaultsV3_1);
		}).not.toThrowError();
	});

	it("validate - real light scene", async () => {
		const obj = {
			build_date: "2022-08-02T14:50:33.512Z",
			build_version: "3.2.1.5",
			settings_version: "3.4",
			ar: {
				enable: true,
				autoScaling: true,
			},
			camera: {
				cameras: {
					top: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: 0,
							y: 0,
							z: 0,
						},
						type: "top",
						zoomExtentsFactor: 1,
						target: {
							x: 0,
							y: 0,
							z: 0,
						},
					},
					left: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: null,
							y: null,
							z: null,
						},
						type: "left",
						zoomExtentsFactor: 1,
						target: {
							x: null,
							y: null,
							z: null,
						},
					},
					bottom: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: null,
							y: null,
							z: null,
						},
						type: "bottom",
						zoomExtentsFactor: 1,
						target: {
							x: null,
							y: null,
							z: null,
						},
					},
					back: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: null,
							y: null,
							z: null,
						},
						type: "back",
						zoomExtentsFactor: 1,
						target: {
							x: null,
							y: null,
							z: null,
						},
					},
					perspective: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							enablePan: true,
							autoRotationSpeed: 0,
							movementSmoothness: 0.5,
							enableAutoRotation: false,
							rotationSpeed: 0.5,
							restrictions: {
								zoom: {
									minDistance: 0,
									maxDistance: null,
								},
								position: {
									sphere: {
										radius: null,
										center: {
											x: 0,
											y: 0,
											z: 0,
										},
									},
									cube: {
										max: {
											x: null,
											y: null,
											z: null,
										},
										min: {
											x: null,
											y: null,
											z: null,
										},
									},
								},
								target: {
									sphere: {
										radius: null,
										center: {
											x: 0,
											y: 0,
											z: 0,
										},
									},
									cube: {
										max: {
											x: null,
											y: null,
											z: null,
										},
										min: {
											x: null,
											y: null,
											z: null,
										},
									},
								},
								rotation: {
									minPolarAngle: 0,
									maxPolarAngle: 180,
									maxAzimuthAngle: null,
									minAzimuthAngle: null,
								},
							},
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							enableRotation: true,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: 0,
							y: -82.21459197998047,
							z: 56.22639465332031,
						},
						type: "perspective",
						fov: 60,
						zoomExtentsFactor: 1,
						target: {
							x: 0,
							y: 7,
							z: -3.25,
						},
					},
					right: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: null,
							y: null,
							z: null,
						},
						type: "right",
						zoomExtentsFactor: 1,
						target: {
							x: null,
							y: null,
							z: null,
						},
					},
					front: {
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						controls: {
							input: {
								mouse: {
									pan: 2,
									rotate: 0,
									zoom: 1,
								},
								touch: {
									pan: 3,
									rotate: 1,
									zoom: 2,
								},
								keys: {
									up: 38,
									right: 39,
									down: 40,
									left: 37,
								},
							},
							panSpeed: 0.5,
							enablePan: true,
							movementSmoothness: 0.5,
							keyPanSpeed: 0.5,
							enableKeyPan: false,
							damping: 0.1,
							enableZoom: true,
							zoomSpeed: 0.5,
						},
						cameraMovementDuration: 800,
						enableCameraControls: true,
						autoAdjust: false,
						position: {
							x: null,
							y: null,
							z: null,
						},
						type: "front",
						zoomExtentsFactor: 1,
						target: {
							x: null,
							y: null,
							z: null,
						},
					},
				},
				cameraId: "perspective",
			},
			environment: {
				clearAlpha: 1,
				clearColor: "#ffffffff",
				map: "photo_studio",
				mapAsBackground: false,
				mapResolution: "1024",
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				intensity: 1,
				blurriness: 0,
			},
			environmentGeometry: {
				gridColor: "#44444426",
				gridVisibility: true,
				groundPlaneColor: "#636363ff",
				groundPlaneVisibility: true,
				groundPlaneShadowColor: "#d3d3d3ff",
				groundPlaneShadowVisibility: false,
			},
			general: {
				transformation: {
					translation: {
						x: 0,
						y: 0,
						z: 0,
					},
					scale: {
						x: 1,
						y: 1,
						z: 1,
					},
					rotation: {
						x: 0,
						y: 0,
						z: 0,
					},
				},
				blurWhenBusy: true,
				commitSettings: false,
				commitParameters: false,
				pointSize: 1,
				showMessages: true,
				defaultMaterialColor: "#199b9bff",
			},
			light: {
				lightScenes: {
					"0a49c6e9-48a0-4fd9-9fbe-f8fc69146e4e": {
						name: "standard",
						lights: {
							"ac8123eb-d2d0-4f89-9256-25721ced975d": {
								name: "directional1",
								type: "directional",
								properties: {
									intensity: 1,
									shadowMapResolution: 1024,
									shadowMapBias: -0.003,
									color: "#ffffff",
									direction: {
										x: -0.5774000287055969,
										y: -0.5774000287055969,
										z: 0.5774000287055969,
									},
									castShadow: false,
								},
								order: 1,
							},
							"00f148cc-ef85-456f-b0b5-c182dca74361": {
								name: "directional0",
								type: "directional",
								properties: {
									intensity: 2.5,
									shadowMapResolution: 1024,
									shadowMapBias: -0.003,
									color: "#ffffff",
									direction: {
										x: 0.5774000287055969,
										y: -0.5774000287055969,
										z: 0.5774000287055969,
									},
									castShadow: true,
								},
								order: 0,
							},
						},
					},
				},
				lightSceneId: "0a49c6e9-48a0-4fd9-9fbe-f8fc69146e4e",
			},
			rendering: {
				ambientOcclusion: false,
				ambientOcclusionIntensity: 0.1,
				automaticColorAdjustment: false,
				beautyRenderDelay: 50,
				beautyRenderBlendingDuration: 1500,
				lights: true,
				outputEncoding: "srgb",
				physicallyCorrectLights: true,
				shadows: true,
				textureEncoding: "srgb",
				toneMapping: "none",
				toneMappingExposure: 1,
			},
			session: {
				"7ad4db6d-dc94-48b1-8e89-486b75b29df9": {
					hidden: false,
					order: 7,
					displayname: "",
				},
				"23033d60-7078-4836-99ce-990668e4429d": {
					hidden: false,
					order: 2,
					displayname: "",
				},
				"5a5aad86-8173-4bbe-8184-54656370cd4b": {
					hidden: false,
					order: 1,
					displayname: "",
				},
				"30c907b3-dbcf-4266-9f8f-835bb2353cb6": {
					hidden: false,
					order: 6,
					displayname: "",
				},
				"d0ecb53a-90f1-44d6-a6a5-fa47d4a38771": {
					hidden: false,
					order: 9,
					displayname: "",
				},
				"1d1af051-22fd-4f3a-a34c-1882c60a7fda": {
					hidden: false,
					order: 8,
					displayname: "",
				},
				"de76cade-0cea-47b1-879e-1a0b717910e1": {
					hidden: false,
					order: 3,
					displayname: "",
				},
				"dd319731-fb8a-4aa2-9aef-ac85e96a3060": {
					hidden: false,
					order: 4,
					displayname: "",
				},
				"9d9e7f0b-385c-495d-825e-3fec2ce9762d": {
					hidden: false,
					order: 5,
					displayname: "",
				},
				"55b36bef-a2e8-47cb-bd96-8631f95b11be": {
					hidden: false,
					order: 0,
					displayname: "",
				},
				"136b5b03-c3a3-40a1-bc51-009a71c9fc44": {
					hidden: false,
					order: 10,
					displayname: "",
				},
			},
		};
		expect(() => {
			validate(obj);
		}).not.toThrowError();
	});

	it("validate - real light scene", async () => {
		const obj = {
			settings_version: "4.1",
			ar: {
				enable: true,
				autoScaling: true,
			},
			camera: {
				cameraId: "1aff6160-6149-44f2-bb13-a944849fc26d",
				cameras: {
					"1aff6160-6149-44f2-bb13-a944849fc26d": {
						type: "perspective",
						autoAdjust: true,
						cameraMovementDuration: 800,
						controls: {
							autoRotationSpeed: 0,
							damping: 0.1,
							enableAutoRotation: false,
							enableKeyPan: false,
							enablePan: true,
							enableRotation: true,
							enableZoom: true,
							input: {
								keys: {
									up: 38,
									down: 40,
									left: 37,
									right: 39,
								},
								mouse: {
									rotate: 0,
									zoom: 1,
									pan: 2,
								},
								touch: {
									rotate: 1,
									zoom: 2,
									pan: 3,
								},
							},
							keyPanSpeed: 0.5,
							movementSmoothness: 0.5,
							restrictions: {
								position: {
									cube: {
										min: {
											x: null,
											y: null,
											z: null,
										},
										max: {
											x: null,
											y: null,
											z: null,
										},
									},
									sphere: {
										center: {
											x: 0,
											y: 0,
											z: 0,
										},
										radius: null,
									},
								},
								target: {
									cube: {
										min: {
											x: null,
											y: null,
											z: null,
										},
										max: {
											x: null,
											y: null,
											z: null,
										},
									},
									sphere: {
										center: {
											x: 0,
											y: 0,
											z: 0,
										},
										radius: null,
									},
								},
								rotation: {
									minPolarAngle: 0,
									maxPolarAngle: 180,
									minAzimuthAngle: null,
									maxAzimuthAngle: null,
								},
								zoom: {
									minDistance: 0,
									maxDistance: null,
								},
							},
							rotationSpeed: 0.5,
							panSpeed: 0.5,
							zoomSpeed: 0.5,
						},
						enableCameraControls: true,
						fov: 45,
						position: {
							x: 1151.6969902863807,
							y: -1879.1024835548396,
							z: 1175.4946428494486,
						},
						revertAtMouseUp: false,
						revertAtMouseUpDuration: 800,
						target: {
							x: 0,
							y: 0,
							z: 450,
						},
						zoomExtentsFactor: 0.7,
					},
				},
			},
			environment: {
				clearAlpha: 1,
				clearColor: "rgb(255, 255, 255)",
				map: "none",
				mapAsBackground: false,
				mapResolution: "1024",
				rotation: {
					x: 0,
					y: 0,
					z: 0,
					w: 1,
				},
				intensity: 1,
				blurriness: 0,
			},
			environmentGeometry: {
				gridColor: "#ffffff",
				gridVisibility: false,
				groundPlaneColor: "#d3d3d3",
				groundPlaneVisibility: false,
				groundPlaneShadowColor: "#d3d3d3ff",
				groundPlaneShadowVisibility: false,
			},
			general: {
				transformation: {
					scale: {
						x: 1,
						y: 1,
						z: 1,
					},
					translation: {
						x: 0,
						y: 0,
						z: 0,
					},
					rotation: {
						x: 0,
						y: 0,
						z: 0,
					},
				},
				blurWhenBusy: true,
				commitSettings: false,
				commitParameters: false,
				pointSize: 1,
				showMessages: true,
				defaultMaterialColor: "#199b9bff",
			},
			light: {
				lightSceneId: "default",
				lightScenes: {},
			},
			postprocessing: {
				antiAliasingTechnique: "smaa",
				antiAliasingTechniqueMobile: "fxaa",
				enablePostProcessingOnMobile: true,
				ssaaSampleLevel: 2,
				effects: [
					{
						properties: {
							resolutionScale: 1,
							spp: 8,
							distance: 1,
							distanceIntensity: 1,
							intensity: 2.5,
							color: "#000000",
							iterations: 1,
							radius: 15,
							rings: 4,
							lumaPhi: 10,
							depthPhi: 2,
							normalPhi: 3.25,
							samples: 16,
						},
						type: "ssao",
					},
				],
			},
			rendering: {
				automaticColorAdjustment: false,
				beautyRenderDelay: 50,
				beautyRenderBlendingDuration: 1500,
				lights: true,
				outputEncoding: "srgb",
				physicallyCorrectLights: false,
				shadows: true,
				softShadows: true,
				textureEncoding: "srgb",
				toneMapping: "none",
				toneMappingExposure: 1,
			},
			session: {
				"08f6cdd6-44c0-4289-9072-e4884842c78c": {
					order: 0,
					displayname: "",
					hidden: false,
				},
				"c1427f46-1fff-4a1e-8885-349571fa0c37": {
					order: 1,
					displayname: "",
					hidden: false,
				},
				"39a96724-b7e3-4a5e-96e6-847cc115cc6d": {
					order: 2,
					displayname: "",
					hidden: false,
				},
				"bc2e4deb-1133-4a84-b5f2-41d1614cd1ec": {
					order: 3,
					displayname: "",
					hidden: false,
				},
				"ffc86eda-98c7-4037-a492-c3ff87716844": {
					order: 4,
					displayname: "",
					hidden: false,
				},
				"cde8f8a1-51c5-4674-96fb-f6ac72f337e4": {
					order: 5,
					displayname: "",
					hidden: false,
				},
				"12b69904-f604-4587-b018-bcaf2e24188c": {
					order: 6,
					displayname: "",
					hidden: false,
				},
				"370974a2-7746-47d9-9688-11e581826755": {
					order: 7,
					displayname: "",
					hidden: false,
				},
				"3cb344f0-2cc5-4053-af2c-b6954812ef6d": {
					order: 8,
					displayname: "",
					hidden: false,
				},
				"818a9017-2d61-4406-be59-813fb9b91f2f": {
					order: 9,
					displayname: "",
					hidden: false,
				},
				"e9640af8-e026-4a87-845a-a2b822d140c5": {
					order: 10,
					displayname: "",
					hidden: false,
				},
				"aa5c6887-4875-469c-ba80-b12bf5f64ed4": {
					order: 11,
					displayname: "",
					hidden: false,
				},
				"a3a84a85-6122-4837-82ab-f689a5226b60": {
					order: 12,
					displayname: "",
					hidden: false,
				},
				"2c3d50b3-3e27-4034-bfc3-7e9306b40bb5": {
					order: 13,
					displayname: "",
					hidden: false,
				},
				"839afe26-5bb7-41de-80a9-7314345f6896": {
					order: 14,
					displayname: "",
					hidden: false,
				},
				"cbcad077-6620-410c-bc0f-d4c425bd4b32": {
					order: 15,
					displayname: "",
					hidden: false,
				},
				"195eab88-9727-4f40-8182-3df0cde5dbf1": {
					order: 16,
					displayname: "",
					hidden: false,
				},
				"f8a01088-f557-4c53-bc56-3882db098638": {
					order: 17,
					displayname: "",
					hidden: false,
				},
				b27123f310bdf275cac84bf36b597f1e: {
					order: 18,
					displayname: "",
					hidden: false,
				},
				"64ee7cfa06a2fa3a3e31c21e63b38861": {
					order: 19,
					displayname: "",
					hidden: false,
				},
				cf0c8295cb5e6c1bfd431037b34c8f70: {
					order: 20,
					displayname: "",
					hidden: false,
				},
				"4887daf39fca91e2ee7ed7f21ff1713a": {
					order: 21,
					displayname: "",
					hidden: false,
				},
			},
		};

		expect(() => {
			validate(obj);
		}).not.toThrowError();
	});
});
