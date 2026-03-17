import {IDrawingToolsApi} from "@shapediver/viewer.features.drawing-tools";
import {Plane} from "@shapediver/viewer.shared.math";

import {vec3} from "gl-matrix";

/**
 * Manages the mapping between the 8-point conceptual space and the
 * drawing-tools active point indices, based on which points are visible.
 *
 * Conceptual layout: [C0, M1, C2, M3, C4, M5, C6, M7]
 *   Corners (even): C0=BL, C2=BR, C4=TR, C6=TL
 *   Mids X (horiz): M1=bottom, M5=top  (showMidpointsX)
 *   Mids Y (vert):  M3=right,  M7=left (showMidpointsY)
 */
export class FireballPointsMapping {
	public readonly conceptualToDT: number[];
	public readonly dtToConceptual: number[];

	constructor(config: PointVisibilityConfig = {}) {
		const showMidpointsX = config.showMidpointsX ?? true;
		const showMidpointsY = config.showMidpointsY ?? true;

		const dtToConceptual: number[] = [];
		const conceptualToDT: number[] = new Array(8).fill(-1);

		for (let ci = 0; ci < 8; ci++) {
			const isMidX = ci === 1 || ci === 5;
			const isMidY = ci === 3 || ci === 7;
			if (isMidX && !showMidpointsX) continue;
			if (isMidY && !showMidpointsY) continue;
			conceptualToDT[ci] = dtToConceptual.length;
			dtToConceptual.push(ci);
		}

		this.dtToConceptual = dtToConceptual;
		this.conceptualToDT = conceptualToDT;
	}

	// Push all visible conceptual local-space points to the drawing tools.
	public flushRectPoints(
		localPoints: vec3[],
		drawingTools: IDrawingToolsApi,
		plane: Plane,
		temporary: boolean,
	): void {
		for (let ci = 0; ci < 8; ci++) {
			const di = this.conceptualToDT[ci];
			if (di < 0) continue;
			const wp = plane.convertFromLSToWS(localPoints[ci]);
			drawingTools.movePoint(di, [wp[0], wp[1], wp[2]], temporary);
		}
	}
}

/**
 * Configuration for which midpoints of the rectangle should be visible/active.
 * Corners (C0,C2,C4,C6) are always visible.
 * Mids on X edges: M1 (bottom), M5 (top)
 * Mids on Y edges: M3 (right), M7 (left)
 */
export type PointVisibilityConfig = {
	// Horizontal mid-points: M1 (bottom edge) and M5 (top edge)
	showMidpointsX?: boolean;

	// Vertical mid-points: M3 (right edge) and M7 (left edge)
	showMidpointsY?: boolean;
};
