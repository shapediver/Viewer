import {
	IVisualizationSettings,
	PlaneRestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	ITransformationToolsManager,
	Settings,
} from "../ITransformationToolsManager";

export interface IRectangleTransform extends ITransformationToolsManager {}

export type RectangleTransformSettings = {
	/**
	 * The plane restriction for the RectangleTransform.
	 * This is required for the RectangleTransform to work, as it determines the plane on which the RectangleTransform will be displayed and interacted with.
	 */
	plane: PlaneRestrictionProperties;
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
	/**
	 * Options to disable specific midpoints of the rectangle.
	 * Disabled midpoints are not interactive but still visible as locked handles.
	 * By default, all midpoints are enabled.
	 */
	midpoints?: {
		top?: boolean;
		bottom?: boolean;
		left?: boolean;
		right?: boolean;
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
		 * If false, the RectangleTransform cannot be scaled in the local x and y directions.
		 * If true or undefined, scaling in the local x and y directions is allowed.
		 * Default is true (scaling enabled).
		 */
		x?: boolean;
		/**
		 * If false, the RectangleTransform cannot be scaled in the local x and y directions.
		 * If true or undefined, scaling in the local x and y directions is allowed.
		 * Default is true (scaling enabled).
		 */
		y?: boolean;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		xMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		xMax?: number;
		/**
		 * The minimum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no minimum length).
		 */
		yMin?: number;
		/**
		 * The maximum allowed length of the rectangle's sides during scaling.
		 * With this settings, it's possible to restrict the scaling to a certain range.
		 * Default is undefined (no maximum length).
		 */
		yMax?: number;
		/**
		 * The step size for scaling in the local x and y directions.
		 * With this setting, it's possible to snap the scaling to specific increments.
		 * Default is undefined (no snapping).
		 */
		step?: number;
		/**
		 * The threshold for snapping during scaling in the local x and y directions.
		 * With this setting, it's possible to define how close the scaling needs to be to a snap point for it to snap.
		 * Default is undefined (no snapping threshold).
		 */
		stepThreshold?: number;
		/**
		 * The visualization settings for the main scaling handles and the outline.
		 * This allows customizing the appearance of the scaling handles and the outline, such as their color, size, and shape.
		 * Default is undefined (uses default visualization settings).
		 */
		visualization?: IVisualizationSettings;
		/**
		 * The visualization settings for the disabled scaling handles.
		 * This allows customizing the appearance of the disabled scaling handles, such as their color, size, and shape.
		 * Default is undefined (uses default visualization settings).
		 */
		disabledVisualization?: IVisualizationSettings;
	};
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
		/**
		 * The visualization settings for the rotation handle.
		 * This allows customizing the appearance of the rotation handle, such as its color, size, and shape.
		 * Default is undefined (uses default visualization settings).
		 */
		visualization?: IVisualizationSettings;
	};
} & Settings;

export type RectangleTransformSettingsOptional = Partial<RectangleTransformSettings>;
