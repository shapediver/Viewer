import {z} from "zod";
import {IMaterialStandardDataPropertiesDefinition} from "../data/material/IMaterialStandardData";
import {IOutlineEffectDefinition} from "../renderingEngine/IPostProcessingEffectDefinitions";

// #region Type aliases (1)

export type InteractionParameterSettingsType =
	| "selection"
	| "gumball"
	| "dragging";

export type InteractionEffect =
	| string
	| IMaterialStandardDataPropertiesDefinition
	| IOutlineEffectDefinition
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
	/** The mode to determine when the parameter is active. (default: 'default') */
	activeMode?: "default" | "activeOnStart";
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

const interactionEffectSchema = z
	.union([z.string(), z.object({}).passthrough()])
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
	activeMode: z.enum(["default", "activeOnStart"]).optional(),
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

export const IGumballParameterPropsJsonSchema = z
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
		objects: z
			.array(
				z.object({
					nameFilter: z.string(),
					restrictions: z.array(z.string()),
				}),
			)
			.nullable()
			.optional(),
		restrictions: z
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
			.optional(),
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const IGumballParameterJsonSchema = z.object({
	type: z.literal("gumball"),
	props: IGumballParameterPropsJsonSchema,
});

export const IDraggingParameterPropsJsonSchema = z
	.object({
		draggingColor: interactionEffectSchema.optional(),
		availableColor: interactionEffectSchema.optional(),
		objects: z
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
			.optional(),
		restrictions: z
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
			.optional(),
	})
	.merge(IGeneralInteractionParameterJsonSchema);

export const IDraggingParameterJsonSchema = z.object({
	type: z.literal("dragging"),
	props: IDraggingParameterPropsJsonSchema,
});

export const IInteractionParameterJsonSchema = ISelectionParameterJsonSchema.or(
	IGumballParameterJsonSchema,
).or(IDraggingParameterJsonSchema);

export const validateInteractionParameterSettings = (param: unknown) => {
	return IInteractionParameterJsonSchema.safeParse(param);
};
export const validateSelectionParameterSettings = (param: unknown) => {
	return ISelectionParameterJsonSchema.safeParse(param);
};
export const validateGumballParameterSettings = (param: unknown) => {
	return IGumballParameterJsonSchema.safeParse(param);
};
export const validateDraggingParameterSettings = (param: unknown) => {
	return IDraggingParameterJsonSchema.safeParse(param);
};

// #endregion Variables (7)
