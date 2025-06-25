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
import {cameraSettingsSchema} from "../v6_2/Validator";

export const generalSettingsSchema = z.object({
	transformation: z.object({
		scale: z.object({x: z.number(), y: z.number(), z: z.number()}),
		translation: z.object({x: z.number(), y: z.number(), z: z.number()}),
		rotation: z.object({x: z.number(), y: z.number(), z: z.number()}),
	}),
	blurWhenBusy: z.boolean(),
	pointSize: z.number(),
	showMessages: z.boolean(),
});

export const configurationSettingsSchema = z
	.object({
		parametersCommit: z.boolean().optional(),
		parametersDisable: z.boolean().optional(),
		hideDataOutputs: z.boolean().optional(),
		hideDataOutputsIframe: z.boolean().optional(),
		hideDesktopClients: z.boolean().optional(),
		hideExports: z.boolean().optional(),
		hideExportsIframe: z.boolean().optional(),
		hideSavedStates: z.boolean().optional(),
		hideSavedStatesIframe: z.boolean().optional(),
		hideAttributeVisualization: z.boolean().optional(),
		hideAttributeVisualizationIframe: z.boolean().optional(),
		hideJsonMenu: z.boolean().optional(),
		hideJsonMenuIframe: z.boolean().optional(),
	})
	.optional();

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
