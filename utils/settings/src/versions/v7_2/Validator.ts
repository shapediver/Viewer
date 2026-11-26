import {z} from "../../zod";
import {
	arSettingsSchema,
	environmentSettingsSchema,
	lightSettingsSchema,
	postProcessingSchema as postProcessingSchemaV5,
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
import {cameraSettingsSchema} from "../v7_1/Validator";

const zNumOrInf = z.union([
	z.number(),
	z.literal(Infinity),
	z.literal(-Infinity),
]);

const ambientOcclusionModeSchema = z.enum(["composite", "shading"]);
// optional: an unset value means "physical" at runtime (the look before the option existed)
const ambientOcclusionSpecularOcclusionSchema = z.enum(["physical", "uniform"]);

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
			mode: ambientOcclusionModeSchema.optional(),
			specularOcclusion:
				ambientOcclusionSpecularOcclusionSchema.optional(),
			excludeGems: z.boolean(),
		})
		.optional(),
	type: z.literal("hbao"),
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
			mode: ambientOcclusionModeSchema.optional(),
			specularOcclusion:
				ambientOcclusionSpecularOcclusionSchema.optional(),
			excludeGems: z.boolean(),
		})
		.optional(),
	type: z.literal("ssao"),
});

const bloomEffectSchema = z.object({
	properties: z
		.object({
			blendFunction: zNumOrInf.optional(),
			intensity: zNumOrInf.optional(),
			kernelSize: zNumOrInf.optional(),
			luminanceSmoothing: zNumOrInf.optional(),
			luminanceThreshold: zNumOrInf.optional(),
			// optional: with `highlightsOnly`, an unset value means true at runtime
			mipmapBlur: z.boolean().optional(),
			backgroundBloom: z.boolean(),
			highlightsOnly: z.boolean(),
			// optional: an unset value means 8 at runtime (the look before the option existed)
			highlightLimit: zNumOrInf.optional(),
			// optional: an unset value means "mipmap" at runtime (the look before the option existed)
			filter: z.enum(["mipmap", "dualFilter"]).optional(),
		})
		.optional(),
	type: z.literal("bloom"),
});

const ssrEffectSchema = z.object({
	properties: z
		.object({
			intensity: z.number().min(0).optional(),
			maxRoughness: z.number().min(0).optional(),
			steps: z.number().int().min(1).max(64).optional(),
			distance: z.number().min(0).optional(),
			thickness: z.number().min(0).optional(),
			compositing: z.enum(["radiance", "specular"]).optional(),
			enableOnMobile: z.boolean().optional(),
		})
		.strict()
		.optional(),
	type: z.literal("ssr"),
});

// The effect schemas of v5 are loose (zod strips unknown keys and most properties are optional),
// so an HBAO/SSAO/bloom/SSR effect with an invalid property would still match another effect schema.
// Therefore, the v5 effect schemas only apply to effects that are not HBAO, SSAO, bloom or SSR.
const otherEffectSchema = postProcessingSchemaV5.element.refine(
	(effect) =>
		effect.type !== "hbao" &&
		effect.type !== "ssao" &&
		effect.type !== "bloom" &&
		effect.type !== "ssr",
	{message: "Invalid HBAO, SSAO, bloom or SSR effect"},
);

export const postProcessingSchema = z.array(
	z.union([
		hbaoEffectSchema,
		ssaoEffectSchema,
		bloomEffectSchema,
		ssrEffectSchema,
		otherEffectSchema,
	]),
);

export const postProcessingSettingsSchema = z.object({
	antiAliasingTechnique: z.string(),
	antiAliasingTechniqueMobile: z.string(),
	enablePostProcessingOnMobile: z.boolean(),
	ssaaSampleLevel: zNumOrInf,
	effects: postProcessingSchema,
	hdr: z.boolean(),
});

export const environmentSettingsSchemaV7_2 = environmentSettingsSchema.extend({
	mapPbrMode: z.enum(["legacy", "modern"]),
	mapOrientation: z.enum(["legacy", "threejs"]),
	mapAnalyticDfg: z.boolean(),
	mapFiltering: z.enum(["ggx", "gaussian"]),
	mapSquaredRoughnessBend: z.boolean(),
});

const renderingSizeSchema = z
	.object({
		width: z.number().int().min(1),
		height: z.number().int().min(1),
	})
	.strict();

export const renderingSettingsSchemaV7_2 = renderingSettingsSchema.extend({
	accumulationFrames: z.number().int().min(0),
	accumulationFramesMobile: z.number().int().min(0),
	accumulationMode: z.enum(["display", "hdr"]),
	maximumRenderingSize: renderingSizeSchema,
	maximumRenderingSizeMobile: renderingSizeSchema,
});

export const materialSettingsSchemaV7_2 = materialSettingsSchema.extend({
	physicalGemDispersion: z.boolean(),
	physicalGemFresnel: z.boolean(),
	gemLighting: z.enum(["all", "firstSurface", "environment"]),
	gemEnvironmentMapIntensity: z.number().min(0),
	gemClampColor: z.boolean(),
	gemTracing: z.enum(["sphere", "facets"]),
	gemNormalMapResolution: z.union([
		z.literal(256),
		z.literal(512),
		z.literal(1024),
	]),
});

const schema = z
	.object({
		build_date: z.string().optional(),
		build_version: z.string().optional(),
		settings_version: z.string(),
		ar: arSettingsSchema,
		camera: cameraSettingsSchema,
		environment: environmentSettingsSchemaV7_2,
		environmentGeometry: environmentGeometrySettingsSchema,
		general: generalSettingsSchema,
		light: lightSettingsSchema,
		postprocessing: postProcessingSettingsSchema,
		rendering: renderingSettingsSchemaV7_2,
		session: sessionSettingsSchema,
		material: materialSettingsSchemaV7_2,
		configuration: configurationSettingsSchema,
	})
	.strict();

export const validate = (s: unknown): void => {
	const result = schema.parse(s);
	s = result;
};
