import {ISettings} from "@shapediver/viewer.settings";

export const HighPerformanceDefaults: () => ISettings = () => {
	return {
		build_date: "",
		build_version: "",
		settings_version: "6.1",
		ar: {
			enable: true,
			autoScaling: true,
		},
		camera: {
			cameraId: "",
			cameras: {},
		},
		environment: {
			clearAlpha: 1.0,
			clearColor: "#ffffff",
			map: "null",
			mapAsBackground: false,
			mapResolution: "1024",
			rotation: {x: 0, y: 0, z: 0, w: 1},
			intensity: 1,
			blurriness: 0,
		},
		environmentGeometry: {
			gridColor: "#44444426",
			gridVisibility: false,
			groundPlaneColor: "#636363ff",
			groundPlaneVisibility: false,
			groundPlaneShadowColor: "#d3d3d3ff",
			groundPlaneShadowVisibility: false,
			contactShadowBlur: 1.5,
			contactShadowHeight: 0.25,
			contactShadowDarkness: 2.5,
			contactShadowVisibility: false,
			contactShadowOpacity: 1,
		},
		general: {
			transformation: {
				scale: {x: 1, y: 1, z: 1},
				translation: {x: 0, y: 0, z: 0},
				rotation: {x: 0, y: 0, z: 0},
			},
			blurWhenBusy: true,
			commitSettings: false,
			commitParameters: false,
			pointSize: 1.0,
			showMessages: true,
		},
		light: {
			lightSceneId: "standard",
			lightScenes: {
				standard: {
					name: "standard",
					lights: {
						directional0: {
							name: "directional0",
							type: "directional",
							properties: {
								color: "#fff4e1ff",
								intensity: 1.5,
								direction: {
									x: 0.5774000287055969,
									y: -0.5774000287055969,
									z: 0.5774000287055969,
								},
								castShadow: false,
							},
							order: 0,
						},
						ambient0: {
							name: "ambient0",
							type: "ambient",
							properties: {
								color: "#ffffff",
								intensity: 1,
							},
							order: 1,
						},
					},
				},
			},
		},
		postprocessing: {
			antiAliasingTechnique: "fxaa",
			antiAliasingTechniqueMobile: "fxaa",
			enablePostProcessingOnMobile: false,
			ssaaSampleLevel: 2,
			effects: [],
		},
		rendering: {
			automaticColorAdjustment: true,
			beautyRenderDelay: 50,
			beautyRenderBlendingDuration: 1500,
			lights: true,
			outputEncoding: "srgb",
			physicallyCorrectLights: true,
			shadows: false,
			softShadows: false,
			textureEncoding: "srgb",
			toneMapping: "none",
			toneMappingExposure: 1,
		},
		session: {},
		material: {
			defaultMaterialColor: "#199b9bff",
			materialOverrideType: "lambert",
		},
	};
};
