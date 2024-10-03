import { IInteractionParameterProps } from './IInteractionParameterSettings';

// #region Type aliases (1)

export type SelectionParameterValue = {
    names: string[]
};

// #endregion Type aliases (1)

// #region Interfaces (1)

/**
 * Properties of a selection parameter.
 */
export interface ISelectionParameterProps extends IInteractionParameterProps {
    // #region Properties (2)

    /** The maximum number of objects that can be selected. (default: 1) */
    maximumSelection?: number,
    /** The minimum number of objects that can be selected. (default: 1) */
    minimumSelection?: number,
    /** The color of the objects when selected. (default: '#0d44f0') */
    selectionColor?: string,

    // #endregion Properties (2)
}

// #endregion Interfaces (1)
