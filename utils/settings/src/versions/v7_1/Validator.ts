import {z} from "../../zod";
import {
	arSettingsSchema,
	environmentSettingsSchema,
	lightSettingsSchema,
	postProcessingSettingsSchema,
	renderingSettingsSchema,
	sessionSettingsSchema} from "../v5/Validator";
import {
	environmentGeometrySettingsSchema,
	materialSettingsSchema} from "../v6_1/Validator";
import {
	configurationSettingsSchema,
	generalSettingsSchema} from "../v7/Validator";

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
	initialAutoAdjust: z.boolean(),
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
