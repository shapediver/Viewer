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
			// the metal reflectance of the reference renderer
			mapAnalyticDfg: true,
			// the environment prefiltering of the reference renderer (three.js r160)
			mapFiltering: "gaussian",
			// the reflection-vector bend of the reference renderer (roughness², three.js r160)
			mapSquaredRoughnessBend: true,
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
						// the AO of the reference renderer: Scalable Ambient
						// Obscurance, applied to the indirect light inside the
						// material with three.js's specular occlusion;
						// intensity 1 uses the occlusion as computed (SS-10653)
						mode: "shading",
						specularOcclusion: "physical",
						algorithm: "sao",
						intensity: 1,
						excludeGems: true,
					},
					type: "ssao",
				},
				{
					// polished metal reflects the neighbouring geometry, e.g. the
					// gallery under a ring's head reflects the prongs (SS-10509);
					// desktop only, it costs too much on mobile devices
					properties: {
						// weighted and combined like the reference renderer's
						// reflections (SS-10654)
						compositing: "specular",
						enableOnMobile: false,
					},
					type: "ssr",
				},
				{
					// a glow on the brightest highlights only
					properties: {
						// The bloom numbers of the reference renderer. A lower
						// threshold or a stronger bloom makes overview shots too
						// bright and puts halos around every pavé stone.
						intensity: 0.2,
						luminanceThreshold: 2,
						luminanceSmoothing: 0.5,
						highlightsOnly: true,
						backgroundBloom: false,
						// the bloom algorithm of the reference renderer: with the
						// same numbers, the same glow on metal and gem glints
						// (SS-10655)
						filter: "dualFilter",
					},
					type: "bloom",
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
			// the tone mapping of the reference renderer: with the same
			// environment map the gold is closest to it on every view
			toneMapping: "aces_filmic",
			toneMappingExposure: 1,
			// averages jittered frames while the view is still (SS-10508);
			// fewer frames on mobile, where each one costs more
			accumulationFrames: 32,
			accumulationFramesMobile: 8,
			// averages the frames before bloom and tone mapping, so small
			// mirror highlights keep their brightness, as in the reference
			// renderer (SS-10607)
			accumulationMode: "hdr",
		},
		session: {},
		material: {
			defaultMaterialColor: "#199b9bff",
			...NEW_LOOK_V7_2.material,
		},
	};

	return toSettings(s);
};
