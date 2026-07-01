import {type ISettings} from "./ISettings";

export const Defaults: () => ISettings = () => {
	return {
		build_date: "",
		build_version: "",
		settings_version: "3.1",
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
		},
		environmentGeometry: {
			gridColor: "#44444426",
			gridVisibility: true,
			groundPlaneColor: "#636363ff",
			groundPlaneVisibility: true,
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
		rendering: {
			ambientOcclusion: false,
			ambientOcclusionIntensity: 0.1,
			beautyRenderDelay: 50,
			beautyRenderBlendingDuration: 1500,
			outputEncoding: "srgb",
			physicallyCorrectLights: true,
			shadows: true,
			textureEncoding: "srgb",
			toneMapping: "none",
			toneMappingExposure: 1,
		},
		session: {},
	};
};
