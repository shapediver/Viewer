import {ISettings} from "@shapediver/viewer.settings";

export const FurnitureDefaults: () => ISettings = () => {
	return {
		build_date: "",
		build_version: "",
		settings_version: "6.2",
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
			map: "furniture_studio",
			mapAsBackground: true,
			mapResolution: "1024",
			rotation: {x: 0, y: 0, z: 0, w: 1},
			intensity: 1,
			blurriness: 0.4,
		},
		environmentGeometry: {
			gridColor: "#44444426",
			gridVisibility: false,
			groundPlaneColor: "#101012ff",
			groundPlaneVisibility: false,
			groundPlaneShadowColor: "#3f3f3fff",
			groundPlaneShadowVisibility: true,
			contactShadowBlur: 2.5,
			contactShadowHeight: 0.25,
			contactShadowDarkness: 1,
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
								intensity: 0.75,
								direction: {
									x: 0.5774000287055969,
									y: -0.5774000287055969,
									z: 0.5774000287055969,
								},
								castShadow: true,
								shadowMapResolution: 1024,
								shadowMapBias: -0.003,
							},
							order: 0,
						},
						directional1: {
							name: "directional1",
							type: "directional",
							properties: {
								color: "#fff4e1ff",
								intensity: 2.75,
								direction: {
									x: -0.35,
									y: -0.35,
									z: 0.75,
								},
								castShadow: true,
								shadowMapResolution: 1024,
								shadowMapBias: -0.003,
							},
							order: 0,
						},
						directional_front: {
							name: "directional_front",
							type: "directional",
							properties: {
								color: "#dbf5ff",
								intensity: 0.25,
								direction: {
									x: 0,
									y: -1,
									z: 0.75,
								},
								castShadow: true,
								shadowMapResolution: 1024,
								shadowMapBias: -0.003,
							},
						},
					},
				},
			},
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
					},
					type: "ssao",
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
