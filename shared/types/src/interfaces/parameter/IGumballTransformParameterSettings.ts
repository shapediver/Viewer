import {type RestrictionDefinition} from "../..";
import {type ISelectionParameterProps} from "./ISelectionParameterSettings";

// #region Type aliases (1)

export type GumballTransformParameterValue = {
	names: string[];
	transformations: number[][];
};

// #endregion Type aliases (1)

// #region Interfaces (1)

/**
 * Properties of a draggable object.
 */
export interface IDraggableObject {
	// #region Properties (4)

	/** The name filter for the objects that can be dragged with the defined settings. */
	nameFilter: string;
	/** The ids of the restrictions in the restrictions array to apply for these objects. */
	restrictions: string[];

	// #endregion Properties (4)
}

/**
 * Properties of a selection parameter.
 */
export interface IGumballTransformParameterProps extends ISelectionParameterProps {
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
	/**
	 * The objects that can be dragged.
	 *
	 * For each object, the name filter and the restrictions can be defined.
	 * The name filter is used to filter the objects that can be dragged with the defined settings.
	 * This means that multiple objects can be dragged with different settings, but also multiple objects can be dragged with the same settings.
	 *
	 * This is only used for dragging, not for rotation or scaling!
	 */
	objects?: IDraggableObject[];
	/** The restrictions that can be applied to the draggable objects. */
	restrictions?: RestrictionDefinition[];
	// #endregion Properties (5)
}

// #endregion Interfaces (1)
