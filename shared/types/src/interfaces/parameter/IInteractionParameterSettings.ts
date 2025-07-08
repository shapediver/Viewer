import {z} from "zod";

// #region Type aliases (1)

export type InteractionParameterSettingsType =
	| "selection"
	| "gumball"
	| "dragging";

// #endregion Type aliases (1)

// #region Interfaces (2)

/**
 * General properties of an interaction parameter.
 */
export interface IInteractionParameterProps {
	// #region Properties (2)

	/** If the objects are hoverable. (default: true) */
	hover?: boolean;
	/** The color of the objects when hovered. (default: '#00ff78') */
	hoverColor?: string;
	/** A prompt that can be defined which is displayed instead of the default prompt. */
	prompt?: {
		/** The title when the parameter is inactive. */
		inactiveTitle?: string;
		/** The title when the parameter is active. */
		activeTitle?: string;
		/** The text when the parameter is inactive. */
		activeText?: string;
	};

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

const IGeneralInteractionParameterJsonSchema = z.object({
	hover: z.preprocess(
		(val) => {
			if (val === "true") return true;
			if (val === "false") return false;
			if (val === null) return undefined;
			return val;
		},
		z.preprocess((val) => {
			if (val === "true") return true;
			if (val === "false") return false;
			if (val === null) return undefined;
			return val;
		}, z.boolean().optional()),
	),
	hoverColor: z.string().optional(),
	prompt: z
		.object({
			inactiveTitle: z.string().optional(),
			activeTitle: z.string().optional(),
			activeText: z.string().optional(),
		})
		.optional(),
});

export const ISelectionParameterJsonSchema = z.object({
	type: z.literal("selection"),
	props: z
		.object({
			maximumSelection: z.number().optional(),
			minimumSelection: z.number().optional(),
			nameFilter: z.array(z.string()).optional(),
			selectionColor: z.string().optional(),
		})
		.merge(IGeneralInteractionParameterJsonSchema),
});
export const IGumballParameterJsonSchema = z.object({
	type: z.literal("gumball"),
	props: z
		.object({
			enableRotation: z.preprocess((val) => {
				if (val === "true") return true;
				if (val === "false") return false;
				if (val === null) return undefined;
				return val;
			}, z.boolean().optional()),
			enableRotationAxes: z
				.object({
					x: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					y: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					z: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
				})
				.optional(),
			enableScaling: z.preprocess((val) => {
				if (val === "true") return true;
				if (val === "false") return false;
				if (val === null) return undefined;
				return val;
			}, z.boolean().optional()),
			enableScalingAxes: z
				.object({
					x: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					y: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					z: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
				})
				.optional(),
			enableTranslation: z.preprocess((val) => {
				if (val === "true") return true;
				if (val === "false") return false;
				if (val === null) return undefined;
				return val;
			}, z.boolean().optional()),
			enableTranslationAxes: z
				.object({
					x: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					y: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
					z: z.preprocess((val) => {
						if (val === "true") return true;
						if (val === "false") return false;
						if (val === null) return undefined;
						return val;
					}, z.boolean().optional()),
				})
				.optional(),
			nameFilter: z.array(z.string()).optional(),
			scale: z.number().optional(),
			space: z.literal("local").or(z.literal("world")).optional(),
			selectionColor: z.string().optional(),
		})
		.merge(IGeneralInteractionParameterJsonSchema),
});
export const IDraggingParameterJsonSchema = z.object({
	type: z.literal("dragging"),
	props: z
		.object({
			draggingColor: z.string().optional(),
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
										.optional(),
								}),
							)
							.optional(),
						dragOrigin: z.array(z.number()).optional(),
					}),
				)
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
								.optional(),
						})
						.passthrough(),
				)
				.optional(),
		})
		.merge(IGeneralInteractionParameterJsonSchema),
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
