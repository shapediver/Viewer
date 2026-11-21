import {ISettings} from "@shapediver/viewer.settings";
import {ISettingsV7_2, NEW_LOOK_V7_2, toSettings} from "./SettingsV7_2";

export const Defaults: () => ISettings = () => {
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
			clearColor: "#e2e2e2",
			map: "default_studio",
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
			contactShadowDarkness: 1.5,
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
			hdr: true,
			effects: [
				{
					properties: {
						resolutionScale: 0.5,
						spp: 16,
						distance: 1,
						distanceIntensity: 1,
						intensity: 3.5,
						color: "#000000",

						iterations: 1,
						radius: 12,
						rings: 11,
						lumaPhi: 10,
						depthPhi: 2,
						normalPhi: 3.25,
						samples: 16,
						excludeGems: true,
					},
					type: "ssao",
				},
			],
		},
		rendering: {
			...NEW_LOOK_V7_2.rendering,
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
			...NEW_LOOK_V7_2.material,
		},
	};

	return toSettings(s);
};
