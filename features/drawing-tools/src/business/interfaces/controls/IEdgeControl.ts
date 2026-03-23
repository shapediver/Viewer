import {vec3} from "gl-matrix";

import {IControl} from "./IControl";

/**
 * A control point that is attached to an edge between two points.
 * The control point is defined by the indices of the two points and a direction vector.
 *
 * The control sits at the midpoint of the edge and can only be dragged along the
 * given direction.  When dragged, both point1 and point2 are shifted by the same
 * delta (symmetric displacement).
 */
export interface IEdgeControl extends IControl {
	/**
	 * Drag direction in the DT's local space.  The direction does not need to
	 * be perpendicular to the edge; any direction is permitted.  The actual
	 * displacement for a given mouse move is determined by the closest-point
	 * projection of the mouse ray onto the axis `dragStartMidpoint + t * direction`.
	 *
	 * The direction is updated whenever the edge orientation changes relative to its initial orientation,
	 * so that the control's movement remains consistent with the user's drag direction even after rotations.
	 */
	direction: vec3;

	/**
	 * The index of the first point that defines the edge to which this control is attached.
	 */
	point1: number;

	/**
	 * The index of the second point that defines the edge to which this control is attached.
	 */
	point2: number;
	type: "edge";
}
