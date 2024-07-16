import { z } from 'zod';
import { ISelectionParameterSettings } from './ISelectionParameterSettings';

// #region Type aliases (1)

export type InteractionParameterSettingsType = 'selection';

// #endregion Type aliases (1)

// #region Interfaces (2)

/**
 * General properties of an interaction parameter.
 */
export interface IGeneralInteractionParameterSettings {
    // #region Properties (2)

    /** If the objects are hoverable. (default: true) */
    hover?: boolean,
    /** The names of the objects that can be interacted with. (see Jira document and discussion result) */
    nameFilter?: string[]

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
    props: {
        /** Type of the interaction parameters. */
        type: InteractionParameterSettingsType,
        /** Properties of the interaction parameters. */
        props: ISelectionParameterSettings
    },
    /** Type of the interaction parameters. */
    type: 'interaction'

    // #endregion Properties (2)
}

const IGeneralInteractionParameterJsonSchema = z.object({
    hover: z.boolean().optional(),
    nameFilter: z.array(z.string()).optional(),
});

const ISelectionParameterJsonSchema = z.object({
    type: z.literal('selection'),
    props: z.object({
        maximumSelection: z.number().optional(),
        minimumSelection: z.number().optional(),
    }).merge(IGeneralInteractionParameterJsonSchema),
});

const IInteractionParameterJsonSchema = z.object({
    props: ISelectionParameterJsonSchema,
    type: z.literal('interaction'),
});

export const validateInteractionParameterSettings = (param: unknown) => {
    return IInteractionParameterJsonSchema.safeParse(param);
};

export const validateSelectionParameterSettings = (param: unknown) => {
    return z.object({
        props: ISelectionParameterJsonSchema,
        type: z.literal('selection'),
    }).safeParse(param);
};

// #endregion Interfaces (2)
