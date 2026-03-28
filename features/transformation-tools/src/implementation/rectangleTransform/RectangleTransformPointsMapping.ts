import {IDrawingToolsApi} from "@shapediver/viewer.features.drawing-tools";

import {vec3} from "gl-matrix";

/**
 * Manages the mapping between the 8-point conceptual space and the
 * drawing-tools active point indices, based on which points are visible.
 *
 * Conceptual layout: [C0, M1, C2, M3, C4, M5, C6, M7]
 *   C0=BL (X-,Y-), C2=BR (X+,Y-), C4=TR (X+,Y+), C6=TL (X-,Y+)
 *   M1=bottom (Y-), M3=right (X+), M5=top (Y+), M7=left (X-)
 *
 * All four corners are always present in the single drawing-tools instance at
 * fixed DT indices: C0→0, C2→1, C4→2, C6→3.  Locked corners are listed in
 * `disabledDTIndices` so the DT renders them as non-interactive disabled
 * handles.  Midpoints are NOT assigned DT point indices — they are realized as
 * EdgeControls instead.
 */
export class RectangleTransformPointsMapping {
	public readonly conceptualToDT: number[];
	public readonly dtToConceptual: number[];
	public readonly lockedCornerConceptualIndices: number[];
	public readonly disabledDTIndices: number[];
	/**
	 * Midpoint edges that should be created as EdgeControls.
	 * Each entry contains the conceptual index of the midpoint and the
	 * conceptual indices of its two adjacent corners.
	 */
	public readonly midpointEdges: Array<{
		conceptualMidIndex: number;
		corner1CI: number;
		corner2CI: number;
	}>;

	constructor(config: PointVisibilityConfig = {}) {
		const showC0 = config.corners?.bottomLeft ?? true; // BL
		const showC2 = config.corners?.bottomRight ?? true; // BR
		const showC4 = config.corners?.topRight ?? true; // TR
		const showC6 = config.corners?.topLeft ?? true; // TL
		const showM1 = config.midpoints?.bottom ?? true; // bottom
		const showM3 = config.midpoints?.right ?? true; // right
		const showM5 = config.midpoints?.top ?? true; // top
		const showM7 = config.midpoints?.left ?? true; // left

		// Disabled corners are shown visually as locked (non-interactive) handles.
		const lockedCorners: number[] = [];
		if (!showC0) lockedCorners.push(0);
		if (!showC2) lockedCorners.push(2);
		if (!showC4) lockedCorners.push(4);
		if (!showC6) lockedCorners.push(6);
		this.lockedCornerConceptualIndices = lockedCorners;

		// All four corners always occupy fixed DT slots: C0→0, C2→1, C4→2, C6→3.
		// Midpoints (odd conceptual indices) remain -1 — they are EdgeControls.
		this.dtToConceptual = [0, 2, 4, 6];
		this.conceptualToDT = [0, -1, 1, -1, 2, -1, 3, -1];

		const lockedSet = new Set(lockedCorners);
		this.disabledDTIndices = lockedCorners.map(
			(ci) => this.conceptualToDT[ci],
		);

		// Build the list of midpoint edges that should become EdgeControls.
		// A control is only created when the midpoint is enabled AND neither
		// adjacent corner is locked.
		const midpointEdges: {
			conceptualMidIndex: number;
			corner1CI: number;
			corner2CI: number;
		}[] = [];
		const midDefs: Array<{
			mi: number;
			c1: number;
			c2: number;
			show: boolean;
		}> = [
			{mi: 1, c1: 0, c2: 2, show: showM1},
			{mi: 3, c1: 2, c2: 4, show: showM3},
			{mi: 5, c1: 4, c2: 6, show: showM5},
			{mi: 7, c1: 6, c2: 0, show: showM7},
		];
		for (const {mi, c1, c2, show} of midDefs) {
			if (show) {
				midpointEdges.push({
					conceptualMidIndex: mi,
					corner1CI: c1,
					corner2CI: c2,
				});
			}
		}
		this.midpointEdges = midpointEdges;
	}

	// Push all four corner local-space points to the drawing tools.
	public flushRectPoints(
		localPoints: vec3[],
		drawingTools: IDrawingToolsApi,
		temporary: boolean,
	): void {
		for (let di = 0; di < this.dtToConceptual.length; di++) {
			const ci = this.dtToConceptual[di];
			const p = localPoints[ci];
			drawingTools.movePoint(di, [p[0], p[1], p[2]], temporary);
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
