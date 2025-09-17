import {RestrictionDefinition} from "./IRestrictionSettings";
import {ISelectionParameterProps} from "./ISelectionParameterSettings";

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
export interface IGumballParameterProps extends ISelectionParameterProps {
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
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
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
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
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
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
	};
	/** The scale of the controls. The scale divides the scene bounding sphere to get the actual size. (default: 0.005) */
	scale?: number;
	/** The space in which the controls operate. In world space, scaling is not available. (default: 'local') */
	space?: "local" | "world";
	restrictions?: RestrictionDefinition[];
	// #endregion Properties (5)
}

// #endregion Interfaces (1)
