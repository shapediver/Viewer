import {type RestrictionDefinition} from "../..";
import {type IPlaneRestrictionDefinition} from "./IRestrictionSettings";
import {type ISelectionParameterProps} from "./ISelectionParameterSettings";

/**
 * Properties of a draggable object.
 */
export interface IDraggableObject {
	/** The name filter for the objects that can be dragged with the defined settings. */
	nameFilter: string;

	/** The ids of the restrictions in the restrictions array to apply for these objects. */
	restrictions: string[];
}

/**
 * Properties of a selection parameter.
 */
export interface IRectangleTransformParameterProps
	extends ISelectionParameterProps {
	/**
	 * Options to disable specific points of the rectangle.
	 * Disabled points are not interactive but still visible as locked handles.
	 * By default, all points are enabled.
	 */
	corners?: {
		bottomLeft?: boolean;
		bottomRight?: boolean;
		topRight?: boolean;
		topLeft?: boolean;
	};

	/** If the rotation is enabled. (default: true) */
	enableRotation?: boolean;

	/** If the scaling is enabled. (default: true) */
	enableScaling?: boolean;

	/** If the translation is enabled. (default: true) */
	enableTranslation?: boolean;

	/**
	 * Options to disable specific edgeControls of the rectangle.
	 * Disabled edgeControls are not interactive but still visible as locked handles.
	 * By default, all edgeControls are enabled.
	 */
	edgeControls?: {
		top?: boolean;
		bottom?: boolean;
		left?: boolean;
		right?: boolean;
	};

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

	/**
	 * The plane restriction for the RectangleTransform.
	 * At least the plane type and the plane vectors need to be defined if a custom plane restriction is provided.
	 * If not provided, a default plane restriction will be applied.
	 */
	plane?: Partial<IPlaneRestrictionDefinition>;

	/** The restrictions that can be applied to the draggable objects. */
	restrictions?: RestrictionDefinition[];
	rotation?: {
		/**
		 * The step size for rotation around the plane normal. The step is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to snap the rotation to specific increments.
		 * Default is undefined (no snapping).
		 */
		step?: number;
		/**
		 * The threshold for snapping during rotation around the plane normal. With this setting, it's possible to define how close the rotation needs to be to a snap point for it to snap.
		 * Default is undefined (no snapping threshold).
		 */
		stepThreshold?: number;
		/**
		 * The minimum allowed rotation angle around the plane normal. The angle is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to restrict the rotation to a certain range.
		 * Default is undefined (no minimum angle).
		 */
		min?: number;
		/**
		 * The maximum allowed rotation angle around the plane normal. The angle is provided in degrees for easier configuration but will be converted to radians internally.
		 * With this setting, it's possible to restrict the rotation to a certain range.
		 * Default is undefined (no maximum angle).
		 */
		max?: number;
		/**
		 * Distance of the rotation handle above the top edge of the rectangle, expressed as a fraction of the rectangle's height.
		 * Default is 0.25.
		 */
		handleDistance?: number;
	};

	/**
	 * Scaling options for the RectangleTransform.
	 */
	scaling?: {
		/**
		 * If true, the RectangleTransform will maintain a uniform scale, meaning it will scale equally in all directions based on the average of the local x and y scales.
		 * If false or undefined, the RectangleTransform will scale independently in the local x and y directions.
		 * Default is false (non-uniform scaling).
		 */
		uniform?: boolean;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		uMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		uMax?: number;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		vMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		vMax?: number;
		/**
		 * The step size for scaling in the local x and y directions. The step is provided in world units.
		 * With this setting, it's possible to snap the scaling to specific increments.
		 * Default is undefined (no snapping).
		 */
		step?: number;
	};
}

export type RectangleTransformParameterValue = {
	names: string[];
	transformations: number[][];
};
