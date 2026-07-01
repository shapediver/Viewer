import {mat4, vec3} from "gl-matrix";

import {type IGeometry} from "./IGeometry";

export interface IPlane extends IGeometry {
	constant: number;
	normal: vec3;
	vector_u: vec3;
	vector_v: vec3;

	/**
	 * Applies a 4x4 transformation matrix to the plane, transforming its normal and adjusting its constant accordingly.
	 * The plane's normal is transformed using the inverse transpose of the upper-left 3x3 portion of the matrix to ensure it remains perpendicular to the plane after transformation.
	 * The constant is adjusted based on the transformed normal and the original constant to maintain the correct distance from the origin.
	 * @param matrix The 4x4 transformation matrix
	 * @returns The transformed plane (this)
	 */
	applyMatrix(matrix: mat4): IPlane;

	/**
	 * Clamps a point to the closest point on the plane. If the point is above the plane, it will be projected down onto the plane; if it's below, it will be projected up onto the plane. If it's already on the plane, it will be returned unchanged.
	 * The clamping is done by calculating the signed distance from the point to the plane and then moving the point along the plane's normal by that distance.
	 * @param point The point to clamp
	 * @returns The clamped point on the plane
	 */
	clampPoint(point: vec3): vec3;

	/**
	 * Creates a new plane that is a copy of this plane. The new plane will have the same normal, constant, and vector_u/vector_v as this plane, but will be a separate instance that can be modified independently.
	 * @returns A new plane that is a clone of this plane
	 */
	clone(): IPlane;

	/**
	 * Checks if a given point is on the plane. A point is considered to be on the plane if the signed distance from the point to the plane is zero (or very close to zero, within a small epsilon threshold to account for floating-point precision).
	 * The signed distance is calculated using the plane equation: distance = normal . point + constant. If this distance is zero, the point lies on the plane; if it's positive, the point is above the plane; if it's negative, the point is below the plane.
	 * @param point The point to check
	 * @return True if the point is on the plane, false otherwise
	 */
	containsPoint(point: vec3): boolean;

	/**
	 * Converts a point from local plane space (u, v, w) back to world space.
	 * The local origin is the point on the plane closest to the world origin.
	 * u/v are coordinates along vector_u/vector_v; w is the signed distance along the normal.
	 * @param point The local plane space coordinates (u, v, w)
	 * @returns The corresponding world-space point
	 */
	convertFromLSToWS(point: vec3): vec3;

	/**
	 * Converts a world-space point to local plane space (u, v, w).
	 * u = projection onto vector_u, v = projection onto vector_v,
	 * w = signed distance from the plane along the normal.
	 * The local origin is the point on the plane closest to the world origin.
	 * If project=true, the point is projected onto the plane (w=0); otherwise, w is the actual signed distance.
	 * @param point The world-space point to convert
	 * @param project Whether to project the point onto the plane (setting w=0) or keep the actual distance in w
	 * @returns The local plane space coordinates (u, v, w)
	 */
	convertFromWSToLS(point: vec3, project?: boolean): vec3;

	/**
	 * Gets the signed distance from a given point to the plane. The distance is positive if the point is above the plane (in the direction of the normal), negative if it's below the plane, and zero if it's on the plane.
	 * The distance is calculated using the plane equation: distance = normal . point + constant.
	 * @param point The point to measure the distance to
	 * @returns The signed distance from the point to the plane
	 */
	distanceToPoint(point: vec3): number;

	/**
	 * Calculates the intersection of a ray with the plane. If the ray is parallel to the plane, it returns null. If the ray originates from the plane, it returns 0.
	 * @param origin The origin of the ray
	 * @param direction The direction of the ray
	 * @returns The distance along the ray to the intersection point, or null if there is no intersection
	 */
	intersect(origin: vec3, direction: vec3): number | null;

	/**
	 * Sets the plane's normal and constant based on a given normal vector and a coplanar point. The normal vector is normalized, and the constant is calculated to ensure that the plane passes through the coplanar point.
	 * @param normal The normal vector of the plane (will be normalized)
	 * @param point A point that lies on the plane
	 * @returns The plane instance (this) with updated normal and constant
	 */
	setFromNormalAndCoplanarPoint(normal: vec3, point: vec3): IPlane;
}
