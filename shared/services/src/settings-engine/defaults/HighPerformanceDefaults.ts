import {ISettings} from "@shapediver/viewer.settings";
import {ISettingsV7_2, NEW_LOOK_V7_2, toSettings} from "./SettingsV7_2";

export const HighPerformanceDefaults: () => ISettings = () => {
	const s: ISettingsV7_2 = {
		build_date: "",
		build_version: "",
		configuration: {},
		settings_version: "7.2",
		ar: {
			enable: true,
			autoScaling: true,
		},
		camera: {
			cameraId: "",
			cameras: {},
			loadDefaultCameras: true,
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
			...NEW_LOOK_V7_2.environment,
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
			// no effects and no tone mapping: an HDR buffer only costs memory bandwidth
			hdr: false,
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
			...NEW_LOOK_V7_2.material,
		},
	};

	return toSettings(s);
};
