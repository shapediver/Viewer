import { z } from 'zod';

// #region Type aliases (1)

export type InteractionParameterSettingsType = 'selection' | 'gumball' | 'dragging';

// #endregion Type aliases (1)

// #region Interfaces (2)

/**
 * General properties of an interaction parameter.
 */
export interface IInteractionParameterProps {
    // #region Properties (2)

    /** If the objects are hoverable. (default: true) */
    hover?: boolean,
    /** The color of the objects when hovered. (default: '#00ff78') */
    hoverColor?: string

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
    props: IInteractionParameterProps,
    /** Type of the interaction parameters. */
    type: InteractionParameterSettingsType,

    // #endregion Properties (2)
}

// #endregion Interfaces (2)

// #region Variables (7)

const IGeneralInteractionParameterJsonSchema = z.object({
    hover: z.boolean().optional(),
    hoverColor: z.string().optional(),
});

export const ISelectionParameterJsonSchema = z.object({
    type: z.literal('selection'),
    props: z.object({
        maximumSelection: z.number().optional(),
        minimumSelection: z.number().optional(),
        nameFilter: z.array(z.string()).optional(),
        selectionColor: z.string().optional(),
    }).merge(IGeneralInteractionParameterJsonSchema),
});
export const IGumballParameterJsonSchema = z.object({
    type: z.literal('gumball'),
    props: z.object({
        enableRotation: z.boolean().optional(),
        enableScaling: z.boolean().optional(),
        enableTranslation: z.boolean().optional(),
        nameFilter: z.array(z.string()).optional(),
        scale: z.number().optional(),
        space: z.literal('local').or(z.literal('world')).optional(),
        selectionColor: z.string().optional(),
    }).merge(IGeneralInteractionParameterJsonSchema),
});
export const IDraggingParameterJsonSchema = z.object({
    type: z.literal('dragging'),
    props: z.any(),
});

export const IInteractionParameterJsonSchema = ISelectionParameterJsonSchema.or(IGumballParameterJsonSchema).or(IDraggingParameterJsonSchema);

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
