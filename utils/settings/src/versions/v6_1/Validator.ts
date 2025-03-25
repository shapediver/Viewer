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

export const generalSettingsSchema = z.object({
	transformation: z.object({
		scale: z.object({x: z.number(), y: z.number(), z: z.number()}),
		translation: z.object({x: z.number(), y: z.number(), z: z.number()}),
		rotation: z.object({x: z.number(), y: z.number(), z: z.number()}),
	}),
	blurWhenBusy: z.boolean(),
	commitSettings: z.boolean(),
	commitParameters: z.boolean(),
	pointSize: z.number(),
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
	contactShadowOpacity: z.number(),
	contactShadowBlur: z.number(),
	contactShadowHeight: z.number(),
	contactShadowDarkness: z.number(),
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
