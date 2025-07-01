import {IInteractionParameterProps} from "./IInteractionParameterSettings";

// #region Type aliases (1)

export type GumballParameterValue = {
	names: string[];
	transformations: number[][];
};

// #endregion Type aliases (1)

// #region Interfaces (1)

/**
 * Properties of a selection parameter.
 */
export interface IGumballParameterProps extends IInteractionParameterProps {
	// #region Properties (5)

	/** If the rotation is enabled. (default: true) */
	enableRotation?: boolean;
	/**
	 * If the rotation per axis is enabled.
	 */
	enableRotationAxes?: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
	};
	/** If the scaling is enabled. (default: false) */
	enableScaling?: boolean;
	/**
	 * If the scaling per axis is enabled.
	 */
	enableScalingAxes?: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
	};
	/** If the translation is enabled. (default: true) */
	enableTranslation?: boolean;
	/**
	 * If the translation per axis is enabled.
	 */
	enableTranslationAxes?: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
	};
	/** The initial transformation of the gumball. If no transformation is supplied, the bounding box center of the object is used. (default: undefined) */
	initialTransformations?: number[];
	/** The names of the objects that can be interacted with. */
	nameFilter?: string[];
	/** The scale of the controls. The scale divides the scene bounding sphere to get the actual size. (default: 0.005) */
	scale?: number;
	/** The space in which the controls operate. In world space, scaling is not available. (default: 'local') */
	space?: "local" | "world";
	/** The color of the objects when selected. (default: '#0d44f0') */
	selectionColor?: string;

	// #endregion Properties (5)
}

// #endregion Interfaces (1)
