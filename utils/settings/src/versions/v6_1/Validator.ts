import {z} from "zod";
import {
	arSettingsSchema,
	cameraSettingsSchema,
	environmentSettingsSchema,
	lightSettingsSchema,
	postProcessingSettingsSchema,
	renderingSettingsSchema,
	sessionSettingsSchema,
} from "../v5/Validator";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);

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
});

export const materialSettingsSchema = z.object({
	defaultMaterialColor: z.string(),
	materialOverrideType: z.string().optional(),
});

export const environmentGeometrySettingsSchema = z.object({
	gridColor: z.string(),
	gridVisibility: z.boolean(),
	groundPlaneColor: z.string(),
	groundPlaneVisibility: z.boolean(),
	groundPlaneShadowColor: z.string(),
	groundPlaneShadowVisibility: z.boolean(),
	contactShadowVisibility: z.boolean(),
	contactShadowOpacity: zNumOrInf,
	contactShadowBlur: zNumOrInf,
	contactShadowHeight: zNumOrInf,
	contactShadowDarkness: zNumOrInf,
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
	})
	.strict();

export const validate = (s: unknown): void => {
	const result = schema.parse(s);
	s = result;
};
