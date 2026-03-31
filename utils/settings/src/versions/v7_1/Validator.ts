import {z} from "zod";
import {
	arSettingsSchema,
	environmentSettingsSchema,
	lightSettingsSchema,
	postProcessingSettingsSchema,
	renderingSettingsSchema,
	sessionSettingsSchema,
} from "../v5/Validator";
import {
	environmentGeometrySettingsSchema,
	materialSettingsSchema,
} from "../v6_1/Validator";
import {
	configurationSettingsSchema,
	generalSettingsSchema,
} from "../v7/Validator";

const cameraControlsSchema = z.object({
	autoRotationSpeed: z.number(),
	damping: z.number(),
	enableAutoRotation: z.boolean(),
	enableKeyPan: z.boolean(),
	enablePan: z.boolean(),
	enableRotation: z.boolean(),
	enableZoom: z.boolean(),
	input: z.object({
		keys: z.object({
			up: z.number(),
			down: z.number(),
			left: z.number(),
			right: z.number(),
		}),
		mouse: z.object({
			rotate: z.number(),
			zoom: z.number(),
			pan: z.number(),
		}),
		touch: z.object({
			rotate: z.number(),
			zoom: z.number(),
			pan: z.number(),
		}),
	}),
	keyPanSpeed: z.number(),
	movementSmoothness: z.number(),
	restrictions: z.object({
		position: z.object({
			cube: z.object({
				min: z.object({
					x: z.number().nullable(),
					y: z.number().nullable(),
					z: z.number().nullable(),
				}),
				max: z.object({
					x: z.number().nullable(),
					y: z.number().nullable(),
					z: z.number().nullable(),
				}),
			}),
			sphere: z.object({
				center: z.object({x: z.number(), y: z.number(), z: z.number()}),
				radius: z.number().nullable(),
			}),
		}),
		target: z.object({
			cube: z.object({
				min: z.object({
					x: z.number().nullable(),
					y: z.number().nullable(),
					z: z.number().nullable(),
				}),
				max: z.object({
					x: z.number().nullable(),
					y: z.number().nullable(),
					z: z.number().nullable(),
				}),
			}),
			sphere: z.object({
				center: z.object({x: z.number(), y: z.number(), z: z.number()}),
				radius: z.number().nullable(),
			}),
		}),
		rotation: z.object({
			minPolarAngle: z.number(),
			maxPolarAngle: z.number(),
			minAzimuthAngle: z.number().nullable(),
			maxAzimuthAngle: z.number().nullable(),
		}),
		zoom: z.object({
			minDistance: z.number(),
			maxDistance: z.number().nullable(),
		}),
	}),
	rotationSpeed: z.number(),
	panSpeed: z.number(),
	zoomSpeed: z.number(),
	enableAzimuthRotation: z.boolean(),
	enableObjectControls: z.boolean(),
	enablePolarRotation: z.boolean(),
	enableTurntableControls: z.boolean(),
	objectControlsCenter: z.object({
		x: z.number(),
		y: z.number(),
		z: z.number(),
	}),
	turntableCenter: z.object({x: z.number(), y: z.number(), z: z.number()}),
});

const generalCameraSchema = z.object({
	name: z.string().optional(),
	type: z.string(),
	autoAdjust: z.boolean(),
	cameraMovementDuration: z.number(),
	controls: cameraControlsSchema,
	enableCameraControls: z.boolean(),
	initialAutoAdjust: z.boolean(),
	position: z.object({
		x: z.number().nullable(),
		y: z.number().nullable(),
		z: z.number().nullable(),
	}),
	revertAtMouseUp: z.boolean(),
	revertAtMouseUpDuration: z.number(),
	target: z.object({
		x: z.number().nullable(),
		y: z.number().nullable(),
		z: z.number().nullable(),
	}),
	zoomExtentsFactor: z.number().positive(),
	sceneRotation: z.object({x: z.number(), y: z.number()}),
});

const perspectiveCameraSchema = generalCameraSchema.extend({
	fov: z.number().positive(),
});

export const cameraSchema = z.record(
	z.union([perspectiveCameraSchema, generalCameraSchema]),
);

export const cameraSettingsSchema = z.object({
	cameraId: z.string(),
	cameras: cameraSchema,
	loadDefaultCameras: z.boolean(),
});

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
		material: materialSettingsSchema,
		configuration: configurationSettingsSchema,
	})
	.strict();

export const validate = (s: unknown): void => {
	const result = schema.parse(s);
	s = result;
};
