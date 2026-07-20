import {z} from "../../zod";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);
const zNumOrInfPositive = z.union([z.number().positive(), z.literal(Infinity)]);

const lightSchema = z
	.object({
		id: z.string().optional(),
		name: z.string().optional(),
		type: z.string().optional(),
		properties: z.object({
			color: z.union([zNumOrInf, z.string()]).optional(),
			direction: z
				.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf})
				.optional(),
			position: z
				.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf})
				.optional(),
			target: z
				.object({x: zNumOrInf, y: zNumOrInf, z: zNumOrInf})
				.optional(),
			castShadow: z.boolean().optional(),
			skyColor: z.union([zNumOrInf, z.string()]).optional(),
			groundColor: z.union([zNumOrInf, z.string()]).optional(),
			intensity: zNumOrInf,
			distance: zNumOrInf.optional(),
			angle: zNumOrInf,
			penumbra: zNumOrInf.optional(),
			decay: zNumOrInf.optional(),
			shadowMapResolution: zNumOrInf,
			shadowMapBias: zNumOrInf,
		}),
	})
	.optional();

const lightsSchema = z.record(z.string(), lightSchema);

const lightScenesSchema = z.record(
	z.string(),
	z.object({
		id: z.string(),
		name: z.string().optional(),
		lights: lightsSchema,
	}),
);

const schema = z
	.object({
		build_date: z.string().optional(),
		build_version: z.string().optional(),
		settings_version: z.string().optional(),
		ambientOcclusion: z.boolean().optional(),
		autoRotateSpeed: zNumOrInf,
		backgroundColor: z.string().optional(),
		bumpAmplitude: zNumOrInf,
		camera: z
			.object({
				position: z
					.object({
						x: zNumOrInf,
						y: zNumOrInf,
						z: zNumOrInf,
					})
					.optional(),
				target: z
					.object({
						x: zNumOrInf,
						y: zNumOrInf,
						z: zNumOrInf,
					})
					.optional(),
			})
			.optional(),
		cameraAutoAdjust: z.boolean().optional(),
		cameraMovementDuration: zNumOrInf,
		cameraOrtho: z
			.object({
				position: z
					.object({
						x: zNumOrInf,
						y: zNumOrInf,
						z: zNumOrInf,
					})
					.optional(),
				target: z
					.object({
						x: zNumOrInf,
						y: zNumOrInf,
						z: zNumOrInf,
					})
					.optional(),
			})
			.optional(),
		cameraRevertAtMouseUp: z.boolean().optional(),
		clearAlpha: zNumOrInf,
		clearColor: z.string().optional(),
		commitParameters: z.boolean().optional(),
		controlDamping: zNumOrInf,
		controlNames: z.record(z.string(), z.string()).optional(),
		controlOrder: z.string().array().optional(),
		defaultMaterialColor: z.union([
			z.string(),
			zNumOrInf.array().optional(),
		]),
		disablePan: z.boolean().optional(),
		disableZoom: z.boolean().optional(),
		enableAutoRotation: z.boolean().optional(),
		enableRotation: z.boolean().optional(),
		environmentMap: z.union([z.string(), z.string().array().optional()]),
		environmentMapResolution: z.string().optional(),
		fov: zNumOrInfPositive.optional(),
		lightScene: z.string().optional(),
		lightScenes: lightScenesSchema.nullable().optional(),
		panSpeed: zNumOrInf,
		parametersHidden: z.string().array().optional(),
		pointSize: zNumOrInf,
		revertAtMouseUpDuration: zNumOrInf,
		rotateSpeed: zNumOrInf,
		showEnvironmentMap: z.boolean().optional(),
		showGrid: z.boolean().optional(),
		showGroundPlane: z.boolean().optional(),
		showShadows: z.boolean().optional(),
		topView: z.boolean().optional(),
		zoomExtentFactor: zNumOrInf,
		zoomSpeed: zNumOrInf,
	})
	.passthrough();

export const validate = (s: any): void => {
	const result = schema.parse(s);
	s = result;
};
