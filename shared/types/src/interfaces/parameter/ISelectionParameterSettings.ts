import { IGeneralInteractionParameterSettings, IInteractionParameterSettings } from './IInteractionParameterSettings';

// #region Interfaces (1)

/**
 * Properties of a selection parameter.
 */
export interface ISelectionParameterSettings extends IGeneralInteractionParameterSettings {
    // #region Properties (2)

    /** The maximum number of objects that can be selected. (default: 1) */
    maximumSelection?: number,
    /** The minimum number of objects that can be selected. (default: 1) */
    minimumSelection?: number,

    // #endregion Properties (2)
}

// #endregion Interfaces (1)

// #region Functions (1)

export function isInteractionSelectionParameterSettings(def?: IInteractionParameterSettings): def is { type: 'interaction', props: { type: 'selection', props: ISelectionParameterSettings }} {
    return def?.type === 'interaction' && def.props.type === 'selection';
}

// #endregion Functions (1)
