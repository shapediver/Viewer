import {vec3} from "gl-matrix";

export type RectBasis = {
	axisU: vec3;
	axisV: vec3;
	origin: vec3;
};

export type RectFrameCoord = {
	u: number;
	v: number;
};

/**
 * Build all 8 conceptual points from 4 corner UV coordinates [C0,C2,C4,C6].
 * @param cornerUVs
 * @param basis
 * @returns
 */
export function cornersToFullPoints(
	cornerUVs: RectFrameCoord[],
	basis: RectBasis,
): vec3[] {
	const pts: vec3[] = new Array(8);
	pts[0] = fromRectFrame(cornerUVs[0].u, cornerUVs[0].v, basis);
	pts[2] = fromRectFrame(cornerUVs[1].u, cornerUVs[1].v, basis);
	pts[4] = fromRectFrame(cornerUVs[2].u, cornerUVs[2].v, basis);
	pts[6] = fromRectFrame(cornerUVs[3].u, cornerUVs[3].v, basis);
	for (let i = 1; i < 8; i += 2) {
		pts[i] = vec3.fromValues(
			(pts[(i + 7) % 8][0] + pts[(i + 1) % 8][0]) / 2,
			(pts[(i + 7) % 8][1] + pts[(i + 1) % 8][1]) / 2,
			0,
		);
	}
	return pts;
}

/**
 * Convert a rectangle-frame (u,v) coordinate back to plane local space.
 * @param u
 * @param v
 * @param basis
 * @returns
 */
export function fromRectFrame(u: number, v: number, basis: RectBasis): vec3 {
	return vec3.fromValues(
		basis.origin[0] + u * basis.axisU[0] + v * basis.axisV[0],
		basis.origin[1] + u * basis.axisU[1] + v * basis.axisV[1],
		0,
	);
}

/**
 * Derive the rectangle's current basis from localPoints.
 * Returns { origin (center), axisU (right), axisV (up) } all in plane local space.
 * @param localPoints
 * @returns
 */
export function getRectBasis(localPoints: vec3[]): RectBasis {
	const c0 = localPoints[0];
	const c2 = localPoints[2];
	const c6 = localPoints[6];
	const edgeU = vec3.subtract(vec3.create(), c2, c0);
	const edgeV = vec3.subtract(vec3.create(), c6, c0);
	const lenU = vec3.length(edgeU);
	const lenV = vec3.length(edgeV);
	const axisU =
		lenU > 0
			? vec3.normalize(vec3.create(), edgeU)
			: vec3.fromValues(1, 0, 0);

	// Derive axisV as the perpendicular component of edgeV relative to axisU
	// (Gram-Schmidt). This guards against degenerate inputs where C0→C6 is
	// (nearly) parallel or anti-parallel to C0→C2 — which can occur under
	// combined rotation and min-scaling constraints.
	// Falls back to the 90° CCW rotation of axisU when the perpendicular
	// component is too small.
	const axisVCCW = vec3.fromValues(-axisU[1], axisU[0], 0);
	let axisV: vec3;
	if (lenV > 0) {
		const proj = vec3.dot(edgeV, axisU);
		const perp = vec3.subtract(
			vec3.create(),
			edgeV,
			vec3.scale(vec3.create(), axisU, proj),
		);
		axisV =
			vec3.length(perp) > lenV * 1e-3
				? vec3.normalize(vec3.create(), perp)
				: axisVCCW;
	} else {
		axisV = axisVCCW;
	}

	const origin = vec3.fromValues(
		(c0[0] + localPoints[4][0]) / 2,
		(c0[1] + localPoints[4][1]) / 2,
		0,
	);
	return {origin, axisU, axisV};
}

/**
 * Project a plane-local point into the rectangle's own 2-D frame, returning (u,v) coordinates.
 * @param p
 * @param basis
 * @returns
 */
export function toRectFrame(p: vec3, basis: RectBasis): RectFrameCoord {
	const d = vec3.subtract(vec3.create(), p, basis.origin);
	return {u: vec3.dot(d, basis.axisU), v: vec3.dot(d, basis.axisV)};
}
