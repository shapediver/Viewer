import {z} from "zod";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);
const zNumOrInfPositive = z.union([z.number().positive(), z.literal(Infinity)]);

const cameraControlsSchema = z.object({
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
		position: z.object({
			cube: z.object({
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
			}),
			sphere: z.object({
				center: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
				radius: zNumOrInf.nullable(),
			}),
		}),
		target: z.object({
			cube: z.object({
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
			}),
			sphere: z.object({
				center: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
				radius: zNumOrInf.nullable(),
			}),
		}),
		rotation: z.object({
			minPolarAngle: zNumOrInf,
			maxPolarAngle: zNumOrInf,
			minAzimuthAngle: zNumOrInf.nullable(),
			maxAzimuthAngle: zNumOrInf.nullable(),
		}),
		zoom: z.object({
			minDistance: zNumOrInf,
			maxDistance: zNumOrInf.nullable(),
		}),
	}),
	rotationSpeed: zNumOrInf,
	panSpeed: zNumOrInf,
	zoomSpeed: zNumOrInf,
	enableAzimuthRotation: z.boolean(),
	enableObjectControls: z.boolean(),
	enablePolarRotation: z.boolean(),
	enableTurntableControls: z.boolean(),
	objectControlsCenter: z.object({
		x: zNumOrInf,
		y: zNumOrInf,
		z: zNumOrInf,
	}),
	turntableCenter: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
});

const generalCameraSchema = z.object({
	name: z.string().optional(),
	type: z.string(),
	autoAdjust: z.boolean(),
	cameraMovementDuration: zNumOrInf,
	controls: cameraControlsSchema,
	enableCameraControls: z.boolean(),
	position: z.object({
		x: zNumOrInf.nullable(),
		y: zNumOrInf.nullable(),
		z: zNumOrInf.nullable(),
	}),
	revertAtMouseUp: z.boolean(),
	revertAtMouseUpDuration: zNumOrInf,
	target: z.object({
		x: zNumOrInf.nullable(),
		y: zNumOrInf.nullable(),
		z: zNumOrInf.nullable(),
	}),
	zoomExtentsFactor: zNumOrInfPositive,
	sceneRotation: z.object({x: zNumOrInf, y: zNumOrInf}),
});

const perspectiveCameraSchema = generalCameraSchema.extend({
	fov: zNumOrInfPositive,
});

export const cameraSchema = z.record(
	z.string(),
	z.union([perspectiveCameraSchema, generalCameraSchema]),
);

const ambientLightSchema = z.object({
	color: z.union([zNumOrInf, z.string()]),
	intensity: zNumOrInf,
});

const directionalLightSchema = z.object({
	color: z.union([zNumOrInf, z.string()]),
	intensity: zNumOrInf,
	direction: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
	castShadow: z.boolean(),
	shadowMapResolution: zNumOrInf.optional(),
	shadowMapBias: zNumOrInf.optional(),
});

const hemisphereLightSchema = z.object({
	skyColor: z.union([zNumOrInf, z.string()]),
	intensity: zNumOrInf,
	groundColor: z.union([zNumOrInf, z.string()]),
});

const pointLightSchema = z.object({
	color: z.union([zNumOrInf, z.string()]),
	intensity: zNumOrInf,
	position: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
	distance: zNumOrInf,
	decay: zNumOrInf,
});

const spotLightSchema = z.object({
	color: z.union([zNumOrInf, z.string()]),
	intensity: zNumOrInf,
	position: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
	target: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
	distance: zNumOrInf,
	decay: zNumOrInf,
	angle: zNumOrInf,
	penumbra: zNumOrInf,
});

export const lightSchema = z.record(
	z.string(),
	z.object({
		name: z.string().optional(),
		lights: z.record(
			z.string(),
			z.object({
				name: z.string().optional(),
				type: z.string(),
				order: zNumOrInf.optional(),
				properties: z.union([
					ambientLightSchema,
					directionalLightSchema,
					hemisphereLightSchema,
					pointLightSchema,
					spotLightSchema,
				]),
			}),
		),
	}),
);

const bloomEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			intensity: zNumOrInf.optional(),
			kernelSize: zNumOrInf.optional(),
			luminanceSmoothing: zNumOrInf.optional(),
			luminanceThreshold: zNumOrInf.optional(),
			mipmapBlur: z.boolean(),
		})
		.optional(),
	type: z.string(),
});

const chromaticAberrationEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			modulationOffset: zNumOrInf.optional(),
			offset: z.object({x: zNumOrInf, y: zNumOrInf}).optional(),
			radialModulation: z.boolean().optional(),
		})
		.optional(),
	type: z.string(),
});

const depthOfFieldEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			bokehScale: zNumOrInf.optional(),
			focusDistance: zNumOrInf.optional(),
			focusRange: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const dotScreenEffectSchema = z.object({
	properties: z
		.object({
			angle: zNumOrInf.optional(),
			blendFunction: zNumOrInf.optional(),
			scale: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const gridEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			scale: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const hbaoEffectSchema = z.object({
	properties: z
		.object({
			resolutionScale: zNumOrInf.optional(),
			spp: zNumOrInf.optional(),
			distance: zNumOrInf.optional(),
			distanceIntensity: zNumOrInf.optional(),
			intensity: zNumOrInf.optional(),
			color: z.string().optional(),
			bias: zNumOrInf.optional(),
			thickness: zNumOrInf.optional(),
			iterations: zNumOrInf.optional(),
			radius: zNumOrInf.optional(),
			rings: zNumOrInf.optional(),
			lumaPhi: zNumOrInf.optional(),
			depthPhi: zNumOrInf.optional(),
			normalPhi: zNumOrInf.optional(),
			samples: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const hueSaturationEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			hue: zNumOrInf.optional(),
			saturation: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const noiseEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			premultiply: z.boolean().optional(),
		})
		.optional(),
	type: z.string(),
});

const pixelationEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			granularity: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const scanlineEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			density: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const ssaoEffectSchema = z.object({
	properties: z
		.object({
			resolutionScale: zNumOrInf.optional(),
			spp: zNumOrInf.optional(),
			distance: zNumOrInf.optional(),
			distanceIntensity: zNumOrInf.optional(),
			intensity: zNumOrInf.optional(),
			color: z.string().optional(),
			iterations: zNumOrInf.optional(),
			radius: zNumOrInf.optional(),
			rings: zNumOrInf.optional(),
			lumaPhi: zNumOrInf.optional(),
			depthPhi: zNumOrInf.optional(),
			normalPhi: zNumOrInf.optional(),
			samples: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const tiltShiftEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			feather: zNumOrInf.optional(),
			focusArea: zNumOrInf.optional(),
			kernelSize: zNumOrInf.optional(),
			offset: zNumOrInf.optional(),
			rotation: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

const vignetteEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			darkness: zNumOrInf.optional(),
			offset: zNumOrInf.optional(),
			technique: zNumOrInf.optional(),
		})
		.optional(),
	type: z.string(),
});

export const postProcessingSchema = z.array(
	z.union([
		bloomEffectSchema,
		chromaticAberrationEffectSchema,
		depthOfFieldEffectSchema,
		dotScreenEffectSchema,
		gridEffectSchema,
		hbaoEffectSchema,
		hueSaturationEffectSchema,
		noiseEffectSchema,
		pixelationEffectSchema,
		scanlineEffectSchema,
		ssaoEffectSchema,
		tiltShiftEffectSchema,
		vignetteEffectSchema,
	]),
);

export const arSettingsSchema = z
	.object({
		enable: z.boolean(),
		autoScaling: z.boolean(),
	})
	.optional();

export const cameraSettingsSchema = z.object({
	cameraId: z.string(),
	cameras: cameraSchema,
});

export const environmentSettingsSchema = z.object({
	clearAlpha: zNumOrInf,
	clearColor: z.string(),
	map: z.union([z.string(), z.string().array()]),
	mapAsBackground: z.boolean(),
	mapResolution: z.string(),
	rotation: z.object({
		x: zNumOrInf,
		y: zNumOrInf,
		z: zNumOrInf,
		w: zNumOrInf,
	}),
	blurriness: zNumOrInf,
	intensity: zNumOrInf,
});

export const environmentGeometrySettingsSchema = z.object({
	gridColor: z.string(),
	gridVisibility: z.boolean(),
	groundPlaneColor: z.string(),
	groundPlaneVisibility: z.boolean(),
	groundPlaneShadowColor: z.string(),
	groundPlaneShadowVisibility: z.boolean(),
});

export const generalSettingsSchema = z.object({
	transformation: z.object({
		scale: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
		translation: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
		rotation: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
	}),
	blurWhenBusy: z.boolean(),
	commitSettings: z.boolean(),
	commitParameters: z.boolean(),
	pointSize: zNumOrInf,
	showMessages: z.boolean(),
	defaultMaterialColor: z.string(),
});

export const lightSettingsSchema = z.object({
	lightSceneId: z.string().optional(),
	lightScenes: lightSchema,
});

export const postProcessingSettingsSchema = z.object({
	antiAliasingTechnique: z.string(),
	antiAliasingTechniqueMobile: z.string(),
	enablePostProcessingOnMobile: z.boolean(),
	ssaaSampleLevel: zNumOrInf,
	effects: postProcessingSchema,
});

export const renderingSettingsSchema = z.object({
	automaticColorAdjustment: z.boolean(),
	beautyRenderDelay: zNumOrInf,
	beautyRenderBlendingDuration: zNumOrInf,
	lights: z.boolean(),
	outputEncoding: z.string(),
	physicallyCorrectLights: z.boolean(),
	shadows: z.boolean(),
	softShadows: z.boolean(),
	textureEncoding: z.string(),
	toneMapping: z.string(),
	toneMappingExposure: zNumOrInf,
});

export const sessionSettingsSchema = z.record(
	z.string(),
	z.object({
		order: zNumOrInf.optional(),
		displayname: z.string().optional(),
		hidden: z.boolean().optional(),
	}),
);

const schema = z
	.object({
		build_date: z.string().optional(),
		build_version: z.string().optional(),
		settings_version: z.string(),
		ar: arSettingsSchema,
		camera: cameraSettingsSchema,
		environment: environmentSettingsSchema,
		environmentGeometry: environmentGeometrySettingsSchema,
		general: generalSettingsSchema,
		light: lightSettingsSchema,
		postprocessing: postProcessingSettingsSchema,
		rendering: renderingSettingsSchema,
		session: sessionSettingsSchema,
	})
	.strict();

export const validate = (s: any): void => {
	const result = schema.parse(s);
	s = result;
};
