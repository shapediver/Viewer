import {z} from "zod";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);
const zNumOrInfPositive = z.union([z.number().positive(), z.literal(Infinity)]);

const orbitControlsSchema = z.object({
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
});

const orthographicControlsSchema = z.object({
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
});

const orthographicCameraSchema = z.object({
	name: z.string().optional(),
	type: z.string(),
	autoAdjust: z.boolean(),
	cameraMovementDuration: zNumOrInf,
	controls: orthographicControlsSchema,
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
});

const perspectiveCameraSchema = z.object({
	name: z.string().optional(),
	type: z.string(),
	autoAdjust: z.boolean(),
	cameraMovementDuration: zNumOrInf,
	controls: orbitControlsSchema,
	enableCameraControls: z.boolean(),
	fov: zNumOrInfPositive,
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
});

const cameraSchema = z.record(
	z.string(),
	z.union([perspectiveCameraSchema, orthographicCameraSchema]),
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

const lightSchema = z.record(
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

const schema = z
	.object({
		build_date: z.string().optional(),
		build_version: z.string().optional(),
		settings_version: z.string(),
		ar: z
			.object({
				enable: z.boolean(),
				autoScaling: z.boolean(),
			})
			.optional(),
		camera: z.object({
			cameraId: z.string(),
			cameras: cameraSchema,
		}),
		environment: z.object({
			clearAlpha: zNumOrInf,
			clearColor: z.string(),
			map: z.union([z.string(), z.string().array()]),
			mapAsBackground: z.boolean(),
			mapResolution: z.string(),
		}),
		environmentGeometry: z.object({
			gridColor: z.string(),
			gridVisibility: z.boolean(),
			groundPlaneColor: z.string(),
			groundPlaneVisibility: z.boolean(),
		}),
		general: z.object({
			transformation: z.object({
				scale: z.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf}),
				translation: z.object({
					x: zNumOrInf,
					y: zNumOrInf,
					z: zNumOrInf,
				}),
				rotation: z.object({
					x: zNumOrInf,
					y: zNumOrInf,
					z: zNumOrInf,
				}),
			}),
			blurWhenBusy: z.boolean(),
			commitSettings: z.boolean(),
			commitParameters: z.boolean(),
			pointSize: zNumOrInf,
			showMessages: z.boolean(),
		}),
		light: z.object({
			lightSceneId: z.string().optional(),
			lightScenes: lightSchema,
		}),
		rendering: z.object({
			ambientOcclusion: z.boolean(),
			ambientOcclusionIntensity: z.union([
				z.number().min(0),
				z.literal(Infinity),
			]),
			beautyRenderDelay: zNumOrInf,
			beautyRenderBlendingDuration: zNumOrInf,
			outputEncoding: z.string(),
			physicallyCorrectLights: z.boolean(),
			shadows: z.boolean(),
			textureEncoding: z.string(),
			toneMapping: z.string(),
			toneMappingExposure: zNumOrInf,
		}),
		session: z.record(
			z.string(),
			z.object({
				order: zNumOrInf.optional(),
				displayname: z.string().optional(),
				hidden: z.boolean().optional(),
			}),
		),
	})
	.strict();

export const validate = (s: any): void => {
	const result = schema.parse(s);
	s = result;
};
