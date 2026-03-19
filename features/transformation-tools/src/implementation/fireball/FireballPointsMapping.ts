import {IDrawingToolsApi} from "@shapediver/viewer.features.drawing-tools";
import {Plane} from "@shapediver/viewer.shared.math";

import {vec3} from "gl-matrix";

/**
 * Manages the mapping between the 8-point conceptual space and the
 * drawing-tools active point indices, based on which points are visible.
 *
 * Conceptual layout: [C0, M1, C2, M3, C4, M5, C6, M7]
 *   C0=BL (X-,Y-), C2=BR (X+,Y-), C4=TR (X+,Y+), C6=TL (X-,Y+)
 *   M1=bottom (Y-), M3=right (X+), M5=top (Y+), M7=left (X-)
 */
export class FireballPointsMapping {
	public readonly conceptualToDT: number[];
	public readonly dtToConceptual: number[];
	public readonly lockedCornerConceptualIndices: number[];

	constructor(config: PointVisibilityConfig = {}) {
		const showC0 = config.corners?.bottomLeft ?? true; // BL
		const showC2 = config.corners?.bottomRight ?? true; // BR
		const showC4 = config.corners?.topRight ?? true; // TR
		const showC6 = config.corners?.topLeft ?? true; // TL
		const showM1 = config.midpoints?.bottom ?? true; // bottom
		const showM3 = config.midpoints?.right ?? true; // right
		const showM5 = config.midpoints?.top ?? true; // top
		const showM7 = config.midpoints?.left ?? true; // left

		// Disabled corners are still shown visually (locked handles) but not interactive.
		const lockedCorners: number[] = [];
		if (!showC0) lockedCorners.push(0);
		if (!showC2) lockedCorners.push(2);
		if (!showC4) lockedCorners.push(4);
		if (!showC6) lockedCorners.push(6);
		this.lockedCornerConceptualIndices = lockedCorners;

		const dtToConceptual: number[] = [];
		const conceptualToDT: number[] = new Array(8).fill(-1);

		// Corners that are "disabled" are excluded from the interactive handles DT
		// but are still included in the outline DT and the locked handles DT.
		const interactive: Record<number, boolean> = {
			0: showC0,
			1: showM1,
			2: showC2,
			3: showM3,
			4: showC4,
			5: showM5,
			6: showC6,
			7: showM7,
		};
		for (let ci = 0; ci < 8; ci++) {
			if (!interactive[ci]) continue;
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
 * Configuration for which points of the rectangle should be visible/active.
 */
export type PointVisibilityConfig = {
	corners?: {
		bottomLeft?: boolean; // C0: BL
		bottomRight?: boolean; // C2: BR
		topRight?: boolean; // C4: TR
		topLeft?: boolean; // C6: TL
	};
	midpoints?: {
		top?: boolean; // M5: top edge
		bottom?: boolean; // M1: bottom edge
		left?: boolean; // M7: left edge
		right?: boolean; // M3: right edge
	};
};
