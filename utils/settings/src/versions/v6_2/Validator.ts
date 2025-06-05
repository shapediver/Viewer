import {z} from "zod";
import {
	arSettingsSchema,
	cameraSchema,
	environmentSettingsSchema,
	lightSettingsSchema,
	postProcessingSettingsSchema,
	renderingSettingsSchema,
	sessionSettingsSchema,
} from "../v5/Validator";
import {
	environmentGeometrySettingsSchema,
	generalSettingsSchema,
	materialSettingsSchema,
} from "../v6_1/Validator";

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
	})
	.strict();

export const validate = (s: unknown): void => {
	const result = schema.parse(s);
	s = result;
};
