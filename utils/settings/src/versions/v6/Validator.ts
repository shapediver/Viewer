import { z } from 'zod';
import { arSettingsSchema, cameraSettingsSchema, environmentSettingsSchema, environmentGeometrySettingsSchema, lightSettingsSchema, postProcessingSettingsSchema, renderingSettingsSchema, sessionSettingsSchema } from '../v5/Validator';

export const generalSettingsSchema = z.object({
    transformation: z.object({
        scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        translation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    }),
    blurWhenBusy: z.boolean(),
    commitSettings: z.boolean(),
    commitParameters: z.boolean(),
    pointSize: z.number(),
    showMessages: z.boolean()
});

export const materialSettingsSchema = z.object({
    defaultMaterialColor: z.string(),
    materialOverrideType: z.string().optional(),
});

const schema = z.object({
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
    material: materialSettingsSchema
}).strict();


export const validate = (s: unknown): void => {
    const result = schema.parse(s);
    s = result;
};