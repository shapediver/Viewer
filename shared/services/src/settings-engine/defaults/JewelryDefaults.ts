import {ISettings} from "@shapediver/viewer.settings";

export const JewelryDefaults: () => ISettings = () => {
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
			clearColor: "rgb(66, 66, 66)",
			map: "jewelry_studio",
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
			contactShadowDarkness: 0.5,
			contactShadowVisibility: true,
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
			lightSceneId: "",
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
						intensity: 1,
						luminanceThreshold: 0.95,
					},
					type: "bloom",
				},
			],
		},
		rendering: {
			automaticColorAdjustment: true,
			beautyRenderDelay: 50,
			beautyRenderBlendingDuration: 1500,
			lights: true,
			outputEncoding: "srgb",
			physicallyCorrectLights: true,
			shadows: true,
			softShadows: true,
			textureEncoding: "srgb",
			toneMapping: "aces_filmic",
			toneMappingExposure: 1,
		},
		session: {},
		material: {
			defaultMaterialColor: "#199b9bff",
		},
	};
};
