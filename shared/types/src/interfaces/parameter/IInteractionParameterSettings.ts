import {z} from "../../zod";
import {type IMaterialStandardDataPropertiesDefinition} from "../data/material/IMaterialStandardData";
import {type IOutlineEffectDefinition} from "../renderingEngine/IPostProcessingEffectDefinitions";
import {type IPulseEffectDefinition} from "../renderingEngine/IPulseEffectDefinition";
import {IDrawingParameterVisualizationSettingsJsonSchema} from "./IDrawingParametersSettings";

// #region Type aliases (1)

export type InteractionParameterSettingsType =
	| "selection"
	| "gumball"
	| "dragging"
	| "rectangleTransform"
	| "drawing";

export type InteractionEffect =
	| string
	| IMaterialStandardDataPropertiesDefinition
	| IOutlineEffectDefinition
	| IPulseEffectDefinition
	| null;

// #endregion Type aliases (1)

// #region Interfaces (2)

/**
 * General properties of an interaction parameter.
 */
export interface IInteractionParameterProps {
	// #region Properties (2)

	/** If the objects are hoverable. (default: true) */
	hover?: boolean;
	/** The interaction effect on objects when hovered. (default: '#00ff78') */
	hoverColor?: InteractionEffect;
	/** A prompt that can be defined which is displayed instead of the default prompt. */
	prompt?: {
		/** The title when the parameter is inactive. */
		inactiveTitle?: string;
		/** The title when the parameter is active. */
		activeTitle?: string;
		/** The text when the parameter is inactive. */
		activeText?: string;
	};
	/** Which buttons are available for the interaction parameter. */
	buttons?: {
		/** When true, the clear button is available to reset the parameter. (default: true) */
		clear?: boolean;
	};
	/** The mode to determine when the parameter is active. (default: 'default') */
	activeMode?: "default" | "activeOnStart" | "alwaysActive";
	/** When true, interactions are blocked by non-interactive solid geometry in front of the target. (default: false) */
	occludeBySceneGeometry?: boolean;
	/** The presentation of the interaction parameter. (default: 'toolbar') */
	presentation?: "widget" | "toolbar";
	// #endregion Properties (2)
}

/**
 * The definition of an interaction parameter.
 *
 * For each type, there is a corresponding set of properties.
 */
export interface IInteractionParameterSettings {
	// #region Properties (2)

	/** Properties of the parameter definition. */
	props: IInteractionParameterProps;
	/** Type of the interaction parameters. */
	type: InteractionParameterSettingsType;

	// #endregion Properties (2)
}

// #endregion Interfaces (2)

// #region Variables (7)

const optionalBoolean = z.preprocess((val) => {
	if (val === "true") return true;
	if (val === "false") return false;
	if (val === null) return undefined;
	return val;
}, z.boolean().optional());

const pulseEffectSchema = z.object({
	type: z.literal("pulse"),
	color: z.union([z.string(), z.array(z.number())]).optional(),
	intensity: z.number().min(0).optional(),
	pulseSpeed: z.number().positive().optional(),
});

const interactionEffectSchema = z
	.union([z.string(), pulseEffectSchema, z.object({}).passthrough()])
	.nullable();

const IGeneralInteractionParameterJsonSchema = z.object({
	hover: optionalBoolean,
	hoverColor: interactionEffectSchema.optional(),
	prompt: z
		.object({
			inactiveTitle: z.string().nullable().optional(),
			activeTitle: z.string().nullable().optional(),
			activeText: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	buttons: z
		.object({
			clear: optionalBoolean,
		})
		.nullable()
		.optional(),
	activeMode: z.enum(["default", "activeOnStart", "alwaysActive"]).optional(),
	occludeBySceneGeometry: optionalBoolean,
	presentation: z.enum(["widget", "toolbar"]).optional(),
});

export const ISelectionParameterPropsJsonSchema = z
	.object({
		maximumSelection: z.number().nullable().optional(),
		minimumSelection: z.number().nullable().optional(),
		nameFilter: z.array(z.string()).nullable().optional(),
		selectionColor: interactionEffectSchema.optional(),
		availableColor: interactionEffectSchema.optional(),
		deselectOnEmpty: optionalBoolean,
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const ISelectionParameterJsonSchema = z.object({
	type: z.literal("selection"),
	props: ISelectionParameterPropsJsonSchema,
});

export const IDraggableObjectsJsonSchema = z
	.array(
		z.object({
			nameFilter: z.string(),
			restrictions: z.array(z.string()),
			dragAnchors: z
				.array(
					z.object({
						id: z.string(),
						position: z.array(z.number()),
						rotation: z
							.object({
								axis: z.array(z.number()),
								angle: z.number(),
							})
							.nullable()
							.optional(),
					}),
				)
				.nullable()
				.optional(),
			dragOrigin: z.array(z.number()).nullable().optional(),
		}),
	)
	.nullable()
	.optional();

export const IRestrictionsJsonSchema = z
	.array(
		z
			.object({
				id: z.string(),
				type: z.string(),
				rotation: z
					.object({
						axis: z.array(z.number()),
						angle: z.number(),
					})
					.nullable()
					.optional(),
			})
			.passthrough(),
	)
	.nullable()
	.optional();

export const IGumballTransformParameterPropsJsonSchema = z
	.object({
		enableRotation: optionalBoolean,
		enableRotationAxes: z
			.object({
				x: optionalBoolean,
				y: optionalBoolean,
				z: optionalBoolean,
				xy: optionalBoolean,
				yz: optionalBoolean,
				xz: optionalBoolean,
			})
			.nullable()
			.optional(),
		enableScaling: optionalBoolean,
		enableScalingAxes: z
			.object({
				x: optionalBoolean,
				y: optionalBoolean,
				z: optionalBoolean,
				xy: optionalBoolean,
				yz: optionalBoolean,
				xz: optionalBoolean,
			})
			.nullable()
			.optional(),
		enableTranslation: optionalBoolean,
		enableTranslationAxes: z
			.object({
				x: optionalBoolean,
				y: optionalBoolean,
				z: optionalBoolean,
				xy: optionalBoolean,
				yz: optionalBoolean,
				xz: optionalBoolean,
			})
			.nullable()
			.optional(),
		nameFilter: z.array(z.string()).nullable().optional(),
		scale: z.number().nullable().optional(),
		space: z.literal("local").or(z.literal("world")).nullable().optional(),
		selectionColor: interactionEffectSchema.optional(),
		availableColor: interactionEffectSchema.optional(),
		maximumSelection: z.number().nullable().optional(),
		minimumSelection: z.number().nullable().optional(),
		deselectOnEmpty: optionalBoolean,
		objects: IDraggableObjectsJsonSchema,
		restrictions: IRestrictionsJsonSchema,
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const IGumballTransformParameterJsonSchema = z.object({
	type: z.literal("gumball"),
	props: IGumballTransformParameterPropsJsonSchema,
});

export const IRectangleTransformParameterPropsJsonSchema = z
	.object({
		enableRotation: optionalBoolean,
		enableScaling: optionalBoolean,
		enableTranslation: optionalBoolean,
		nameFilter: z.array(z.string()).nullable().optional(),
		selectionColor: interactionEffectSchema.optional(),
		availableColor: interactionEffectSchema.optional(),
		maximumSelection: z.number().nullable().optional(),
		minimumSelection: z.number().nullable().optional(),
		deselectOnEmpty: optionalBoolean,
		objects: IDraggableObjectsJsonSchema,
		restrictions: IRestrictionsJsonSchema,
		plane: z
			.object({
				id: z.string().optional(),
				type: z.string(),
				origin: z.array(z.number()).optional(),
				vector_u: z.array(z.number()),
				vector_v: z.array(z.number()),
				rotation: z
					.object({
						axis: z.array(z.number()),
						angle: z.number(),
					})
					.nullable()
					.optional(),
			})
			.passthrough()
			.nullable()
			.optional(),
		corners: z
			.object({
				topLeft: optionalBoolean,
				topRight: optionalBoolean,
				bottomLeft: optionalBoolean,
				bottomRight: optionalBoolean,
			})
			.nullable()
			.optional(),
		edgeControls: z
			.object({
				top: optionalBoolean,
				bottom: optionalBoolean,
				left: optionalBoolean,
				right: optionalBoolean,
			})
			.nullable()
			.optional(),
		scaling: z
			.object({
				uniform: optionalBoolean,
				uMin: z.number().nullable().optional(),
				uMax: z.number().nullable().optional(),
				vMin: z.number().nullable().optional(),
				vMax: z.number().nullable().optional(),
				step: z.number().nullable().optional(),
				visualization: IDrawingParameterVisualizationSettingsJsonSchema,
			})
			.nullable()
			.optional(),
		rotation: z
			.object({
				step: z.number().nullable().optional(),
				stepThreshold: z.number().nullable().optional(),
				min: z.number().nullable().optional(),
				max: z.number().nullable().optional(),
				handleDistance: z.number().nullable().optional(),
				visualization: IDrawingParameterVisualizationSettingsJsonSchema,
			})
			.nullable()
			.optional(),
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const IRectangleTransformParameterJsonSchema = z.object({
	type: z.literal("rectangleTransform"),
	props: IRectangleTransformParameterPropsJsonSchema,
});

export const IDraggingParameterPropsJsonSchema = z
	.object({
		draggingColor: interactionEffectSchema.optional(),
		availableColor: interactionEffectSchema.optional(),
		objects: IDraggableObjectsJsonSchema,
		restrictions: IRestrictionsJsonSchema,
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const IDraggingParameterJsonSchema = z.object({
	type: z.literal("dragging"),
	props: IDraggingParameterPropsJsonSchema,
});

export const IInteractionParameterJsonSchema = ISelectionParameterJsonSchema.or(
	IGumballTransformParameterJsonSchema,
)
	.or(IRectangleTransformParameterJsonSchema)
	.or(IDraggingParameterJsonSchema);

export const validateInteractionParameterSettings = (param: unknown) => {
	return IInteractionParameterJsonSchema.safeParse(param);
};
export const validateSelectionParameterSettings = (param: unknown) => {
	return ISelectionParameterJsonSchema.safeParse(param);
};
export const validateGumballTransformParameterSettings = (param: unknown) => {
	return IGumballTransformParameterJsonSchema.safeParse(param);
};
export const validateDraggingParameterSettings = (param: unknown) => {
	return IDraggingParameterJsonSchema.safeParse(param);
};
export const validateRectangleTransformParameterSettings = (param: unknown) => {
	return IRectangleTransformParameterJsonSchema.safeParse(param);
};

// #endregion Variables (7)
