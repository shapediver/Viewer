import {
	IInteractionParameterProps,
	InteractionEffect,
} from "./IInteractionParameterSettings";

// #region Type aliases (1)

export type SelectionParameterValue = {
	names: string[];
};

// #endregion Type aliases (1)

// #region Interfaces (1)

/**
 * Properties of a selection parameter.
 */
export interface ISelectionParameterProps extends IInteractionParameterProps {
	// #region Properties (2)

	/** The maximum number of objects that can be selected. (default: 1) */
	maximumSelection?: number;
	/** The minimum number of objects that can be selected. (default: 1) */
	minimumSelection?: number;
	/** The names of the objects that can be interacted with. (see Jira document and discussion result) */
	nameFilter?: string[];
	/** The interaction effect on objects when selected. (default: '#0d44f0') */
	selectionColor?: InteractionEffect;
	/** The interaction effect on objects when available. (default: '#ffffff') */
	availableColor?: InteractionEffect;
	/** If true, the selection will be cleared when clicking on an empty space. (default: false) */
	deselectOnEmpty?: boolean;

	// #endregion Properties (2)
}

// #endregion Interfaces (1)
