/**
 * Tolerance for comparing the first and the last point of a polyline
 * (JavaScript floating point precision).
 */
const CLOSING_POINT_EPSILON = 0.0000001;

/**
 * Remove the closing point of a polyline: as in Rhino, a closed polyline
 * repeats its first point as the last point. The drawing tools store the
 * points without this repetition (a closed loop is a flag), so a value with a
 * closing point (e.g. a default value exported from Grasshopper) has to be
 * normalized before it is compared with or loaded into the drawing tools.
 *
 * @param points The points of the polyline.
 * @returns The points without a closing point (a new array when a closing
 * point was removed, the given array otherwise).
 */
export const removeClosingPoint = <T extends ArrayLike<number>>(
	points: readonly T[],
): readonly T[] => {
	if (points.length < 2) return points;
	const first = points[0];
	const last = points[points.length - 1];
	const closed =
		Math.abs(first[0] - last[0]) < CLOSING_POINT_EPSILON &&
		Math.abs(first[1] - last[1]) < CLOSING_POINT_EPSILON &&
		Math.abs(first[2] - last[2]) < CLOSING_POINT_EPSILON;
	return closed ? points.slice(0, -1) : points;
};
