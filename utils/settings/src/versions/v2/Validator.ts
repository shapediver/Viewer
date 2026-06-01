import {z} from "zod";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);
const zNumOrInfPositive = z.union([z.number().positive(), z.literal(Infinity)]);

const lightSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	type: z.string(),
	order: zNumOrInf.optional(),
	properties: z.object({
		color: z.union([zNumOrInf, z.string()]).optional(),
		direction: z
			.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf})
			.optional(),
		position: z
			.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf})
			.optional(),
		target: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}).optional(),
		castShadow: z.boolean().optional(),
		skyColor: z.union([zNumOrInf, z.string()]).optional(),
		groundColor: z.union([zNumOrInf, z.string()]).optional(),
		intensity: zNumOrInf.optional(),
		distance: zNumOrInf.optional(),
		angle: zNumOrInf.optional(),
		penumbra: zNumOrInf.optional(),
		decay: zNumOrInf.optional(),
		shadowMapResolution: zNumOrInf.optional(),
		shadowMapBias: zNumOrInf.optional(),
	}),
});

const lightScenesSchema = z.record(
	z.string(),
	z.object({
		id: z.string(),
		name: z.string().optional(),
		lights: z.record(z.string(), lightSchema),
	}),
);

const schema = z
	.object({
		build_date: z.string().optional(),
		build_version: z.string().optional(),
		settings_version: z.string(),
		ar: z
			.object({
				enableCameraSync: z.boolean().optional(),
				enableCameraSyncInitial: z.boolean().optional(),
				enableLightingEstimation: z.boolean().optional(),
				enableTouchControls: z.boolean().optional(),
				enableTouchControlRotation: z.boolean().optional(),
				enableAutomaticPlacement: z.boolean().optional(),
				defaultHitTestType: z.string().optional(),
			})
			.optional(),
		defaultMaterial: z.object({
			bumpAmplitude: zNumOrInf.optional(),
			color: z.union([z.string(), zNumOrInf.array()]).optional(),
			metalness: zNumOrInf.optional(),
			roughness: zNumOrInf.optional(),
		}),
		parameters: z
			.object({
				controlOrder: z.string().array().optional(),
				controlNames: z.record(z.string(), z.string()).optional(),
				parametersHidden: z.string().array().optional(),
			})
			.optional(),
		viewer: z.object({
			blurSceneWhenBusy: z.boolean(),
			ignoreSuperseded: z.boolean().optional(),
			loggingLevel: zNumOrInf.optional(),
			messageLoggingLevel: zNumOrInf.optional(),

			viewerRuntimeId: z.string().optional(),
			hasRestoredSettings: z.boolean().optional(),
			useModelSettings: z.boolean().optional(),
			showMessages: z.boolean().optional(),

			commitSettings: z.boolean(),
			commitParameters: z.boolean(),

			scene: z.object({
				show: z.boolean().optional(),
				showSceneTransition: z.string().optional(),
				duration: zNumOrInf.optional(),
				fullscreen: z.boolean().optional(),
				gridVisibility: z.boolean(),
				groundPlaneReflectionThreshold: zNumOrInf.optional(),
				groundPlaneReflectionVisibility: z.boolean().optional(),
				groundPlaneVisibility: z.boolean(),

				camera: z.object({
					autoAdjust: z.boolean(),
					cameraMovementDuration: zNumOrInf,
					cameraTypes: z.object({
						perspective: z.object({
							default: z.object({
								position: z.object({
									x: zNumOrInf,
									y: zNumOrInf,
									z: zNumOrInf,
								}),
								target: z.object({
									x: zNumOrInf,
									y: zNumOrInf,
									z: zNumOrInf,
								}),
							}),
							fov: zNumOrInf,
							controls: zNumOrInf.optional(),
						}),
						orthographic: z.object({
							default: z.object({
								position: z.object({
									x: zNumOrInf,
									y: zNumOrInf,
									z: zNumOrInf,
								}),
								target: z.object({
									x: zNumOrInf,
									y: zNumOrInf,
									z: zNumOrInf,
								}),
							}),
						}),
						active: zNumOrInf,
					}),
					controls: z.object({
						orbit: z.object({
							autoRotationSpeed: zNumOrInf,
							damping: zNumOrInf,
							enableAutoRotation: z.boolean(),
							enableKeyPan: z.boolean(),
							enablePan: z.boolean(),
							enableRotation: z.boolean(),
							enableZoom: z.boolean(),
							input: z.object({
								keys: z.object({
									up: zNumOrInf,
									down: zNumOrInf,
									left: zNumOrInf,
									right: zNumOrInf,
								}),
								mouse: z.object({
									rotate: zNumOrInf,
									zoom: zNumOrInf,
									pan: zNumOrInf,
								}),
								touch: z.object({
									rotate: zNumOrInf,
									zoom: zNumOrInf,
									pan: zNumOrInf,
								}),
							}),
							keyPanSpeed: zNumOrInf,
							movementSmoothness: zNumOrInf,
							restrictions: z.object({
								position: z
									.object({
										cube: z
											.object({
												min: z.object({
													x: zNumOrInf.nullable(),
													y: zNumOrInf.nullable(),
													z: zNumOrInf.nullable(),
												}),
												max: z.object({
													x: zNumOrInf.nullable(),
													y: zNumOrInf.nullable(),
													z: zNumOrInf.nullable(),
												}),
											})
											.optional(),
										sphere: z
											.object({
												center: z.object({
													x: zNumOrInf,
													y: zNumOrInf,
													z: zNumOrInf,
												}),
												radius: zNumOrInf.nullable(),
											})
											.optional(),
									})
									.optional(),
								target: z
									.object({
										cube: z
											.object({
												min: z.object({
													x: zNumOrInf.nullable(),
													y: zNumOrInf.nullable(),
													z: zNumOrInf.nullable(),
												}),
												max: z.object({
													x: zNumOrInf.nullable(),
													y: zNumOrInf.nullable(),
													z: zNumOrInf.nullable(),
												}),
											})
											.optional(),
										sphere: z
											.object({
												center: z.object({
													x: zNumOrInf,
													y: zNumOrInf,
													z: zNumOrInf,
												}),
												radius: zNumOrInf.nullable(),
											})
											.optional(),
									})
									.optional(),
								rotation: z
									.object({
										minPolarAngle: zNumOrInf,
										maxPolarAngle: zNumOrInf,
										minAzimuthAngle: zNumOrInf.nullable(),
										maxAzimuthAngle: zNumOrInf.nullable(),
									})
									.optional(),
								zoom: z
									.object({
										minDistance: zNumOrInf,
										maxDistance: zNumOrInf.nullable(),
									})
									.optional(),
							}),
							rotationSpeed: zNumOrInf,
							panSpeed: zNumOrInf,
							zoomSpeed: zNumOrInf,
						}),
						fps: z.object({}),
						orthographic: z.object({
							damping: zNumOrInf,
							enableKeyPan: z.boolean(),
							enablePan: z.boolean(),
							enableZoom: z.boolean(),
							input: z.object({
								keys: z.object({
									up: zNumOrInf,
									down: zNumOrInf,
									left: zNumOrInf,
									right: zNumOrInf,
								}),
								mouse: z.object({
									rotate: zNumOrInf,
									zoom: zNumOrInf,
									pan: zNumOrInf,
								}),
								touch: z.object({
									rotate: zNumOrInf,
									zoom: zNumOrInf,
									pan: zNumOrInf,
								}),
							}),
							keyPanSpeed: zNumOrInf,
							movementSmoothness: zNumOrInf,
							panSpeed: zNumOrInf,
							zoomSpeed: zNumOrInf,
						}),
					}),
					enableCameraControls: z.boolean(),
					revertAtMouseUp: z.boolean(),
					revertAtMouseUpDuration: zNumOrInf,
					zoomExtentsFactor: zNumOrInfPositive,
				}),
				lights: z.object({
					helper: z.boolean().optional(),
					lightScene: z.string(),
					lightScenes: lightScenesSchema.nullable(),
				}),
				material: z.object({
					environmentMap: z.union([z.string(), z.string().array()]),
					environmentMapAsBackground: z.boolean(),
					environmentMapResolution: z.enum([
						"256",
						"512",
						"1024",
						"2048",
					]),
				}),
				render: z.object({
					ambientOcclusion: z.boolean(),
					beautyRenderDelay: zNumOrInf,
					beautyRenderBlendingDuration: zNumOrInf.optional(),
					clearAlpha: zNumOrInf,
					clearColor: z.string(),
					pointSize: zNumOrInf,
					shadows: z.boolean(),
					sao: z.object({
						samples: zNumOrInfPositive.optional(),
						kernelRadius: zNumOrInfPositive.optional(),
						intensity: zNumOrInfPositive.optional(),
						standardDev: zNumOrInf.optional(),
					}),
				}),
			}),
		}),
	})
	.strict();

export const validate = (s: any): void => {
	const result = schema.parse(s);
	s = result;
};
