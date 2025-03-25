import {ISettings} from "./ISettings";

export const Defaults: () => ISettings = () => {
	return {
		build_date: "",
		build_version: "",
		settings_version: "4.0",
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
			map: "photo_studio",
			mapAsBackground: false,
			mapResolution: "1024",
			rotation: {x: 0, y: 0, z: 0, w: 1},
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
				scale: {x: 1, y: 1, z: 1},
				translation: {x: 0, y: 0, z: 0},
				rotation: {x: 0, y: 0, z: 0},
			},
			blurWhenBusy: true,
			commitSettings: false,
			commitParameters: false,
			pointSize: 1.0,
			showMessages: true,
			defaultMaterialColor: "#199b9bff",
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
			effects: [],
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
			toneMapping: "none",
			toneMappingExposure: 1,
		},
		session: {},
	};
};
