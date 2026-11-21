import {ISettings} from "@shapediver/viewer.settings";
import {ISettingsV7_2, NEW_LOOK_V7_2, toSettings} from "./SettingsV7_2";

export const JewelryDefaults: () => ISettings = () => {
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
			clearColor: "rgb(66, 66, 66)",
			map: "jewelry_studio",
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
			contactShadowBlur: 3.5,
			contactShadowHeight: 0.25,
			contactShadowDarkness: 1.5,
			contactShadowVisibility: true,
			contactShadowOpacity: 0.6,
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
			// FXAA blurs and shimmers on sub-pixel pavé facets
			antiAliasingTechniqueMobile: "smaa",
			enablePostProcessingOnMobile: true,
			ssaaSampleLevel: 2,
			hdr: true,
			effects: [
				{
					// contact darkening in crevices, not on the stones
					properties: {
						excludeGems: true,
					},
					type: "hbao",
				},
				{
					// a glow on the brightest highlights only; the threshold,
					// smoothing and mipmap blur use the highlight defaults
					properties: {
						// stronger bloom puts halos around every pavé stone
						intensity: 0.25,
						highlightsOnly: true,
						backgroundBloom: false,
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
			toneMapping: "neutral",
			// brings the gold under jewelry_studio closer to the WebGi reference (SS-10494)
			toneMappingExposure: 1.4,
			// averages jittered frames while the view is still (SS-10508);
			// fewer frames on mobile, where each one costs more
			accumulationFrames: 32,
			accumulationFramesMobile: 8,
		},
		session: {},
		material: {
			defaultMaterialColor: "#199b9bff",
			...NEW_LOOK_V7_2.material,
		},
	};

	return toSettings(s);
};
