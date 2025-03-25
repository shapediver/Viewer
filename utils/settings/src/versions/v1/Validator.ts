import {z} from "zod";

const lightSchema = z
	.object({
		id: z.string().optional(),
		name: z.string().optional(),
		type: z.string().optional(),
		properties: z.object({
			color: z.union([z.number(), z.string()]).optional(),
			direction: z
				.object({x: z.number(), y: z.number(), z: z.number()})
				.optional(),
			position: z
				.object({x: z.number(), y: z.number(), z: z.number()})
				.optional(),
			target: z
				.object({x: z.number(), y: z.number(), z: z.number()})
				.optional(),
			castShadow: z.boolean().optional(),
			skyColor: z.union([z.number(), z.string()]).optional(),
			groundColor: z.union([z.number(), z.string()]).optional(),
			intensity: z.number().optional(),
			distance: z.number().optional(),
			angle: z.number().optional(),
			penumbra: z.number().optional(),
			decay: z.number().optional(),
			shadowMapResolution: z.number().optional(),
			shadowMapBias: z.number().optional(),
		}),
	})
	.optional();

const lightsSchema = z.record(lightSchema);

const lightScenesSchema = z.record(
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
		autoRotateSpeed: z.number().optional(),
		backgroundColor: z.string().optional(),
		bumpAmplitude: z.number().optional(),
		camera: z
			.object({
				position: z
					.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					})
					.optional(),
				target: z
					.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					})
					.optional(),
			})
			.optional(),
		cameraAutoAdjust: z.boolean().optional(),
		cameraMovementDuration: z.number().optional(),
		cameraOrtho: z
			.object({
				position: z
					.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					})
					.optional(),
				target: z
					.object({
						x: z.number().optional(),
						y: z.number().optional(),
						z: z.number().optional(),
					})
					.optional(),
			})
			.optional(),
		cameraRevertAtMouseUp: z.boolean().optional(),
		clearAlpha: z.number().optional(),
		clearColor: z.string().optional(),
		commitParameters: z.boolean().optional(),
		controlDamping: z.number().optional(),
		controlNames: z.record(z.string()).optional(),
		controlOrder: z.string().array().optional(),
		defaultMaterialColor: z.union([
			z.string(),
			z.number().array().optional(),
		]),
		disablePan: z.boolean().optional(),
		disableZoom: z.boolean().optional(),
		enableAutoRotation: z.boolean().optional(),
		enableRotation: z.boolean().optional(),
		environmentMap: z.union([z.string(), z.string().array().optional()]),
		environmentMapResolution: z.string().optional(),
		fov: z.number().positive().optional(),
		lightScene: z.string().optional(),
		lightScenes: lightScenesSchema.nullable().optional(),
		panSpeed: z.number().optional(),
		parametersHidden: z.string().array().optional(),
		pointSize: z.number().optional(),
		revertAtMouseUpDuration: z.number().optional(),
		rotateSpeed: z.number().optional(),
		showEnvironmentMap: z.boolean().optional(),
		showGrid: z.boolean().optional(),
		showGroundPlane: z.boolean().optional(),
		showShadows: z.boolean().optional(),
		topView: z.boolean().optional(),
		zoomExtentFactor: z.number().optional(),
		zoomSpeed: z.number().optional(),
	})
	.passthrough();

export const validate = (s: any): void => {
	const result = schema.parse(s);
	s = result;
};
