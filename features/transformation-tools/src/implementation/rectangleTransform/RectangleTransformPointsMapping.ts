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
 * handles.
 */
export class RectangleTransformPointsMapping {
	public readonly conceptualToDT: number[];
	public readonly dtToConceptual: number[];
	public readonly lockedCornerConceptualIndices: number[];
	public readonly disabledDTIndices: number[];
	/**
	 * Each entry contains the conceptual index of the edgeControl and the
	 * conceptual indices of its two adjacent corners.
	 */
	public readonly edgeControls: Array<{
		conceptualEdgeControlIndex: number;
		corner1CI: number;
		corner2CI: number;
	}>;

	constructor(config: PointVisibilityConfig = {}) {
		// All four corners always occupy fixed DT slots: C0→0, C2→1, C4→2, C6→3.
		// EdgeControls (odd conceptual indices) remain -1 — they are EdgeControls.
		this.dtToConceptual = [0, 2, 4, 6];
		this.conceptualToDT = [0, -1, 1, -1, 2, -1, 3, -1];

		// Disabled corners are shown visually as locked (non-interactive) handles.
		this.lockedCornerConceptualIndices = (
			[
				{ci: 0, show: config.corners?.bottomLeft ?? true},
				{ci: 2, show: config.corners?.bottomRight ?? true},
				{ci: 4, show: config.corners?.topRight ?? true},
				{ci: 6, show: config.corners?.topLeft ?? true},
			] as const
		)
			.filter(({show}) => !show)
			.map(({ci}) => ci);
		this.disabledDTIndices = this.lockedCornerConceptualIndices.map(
			(ci) => this.conceptualToDT[ci],
		);

		// Build midpoint EdgeControls — one per enabled midpoint.
		this.edgeControls = [
			{mi: 1, c1: 0, c2: 2, show: config.edgeControls?.bottom ?? true},
			{mi: 3, c1: 2, c2: 4, show: config.edgeControls?.right ?? true},
			{mi: 5, c1: 4, c2: 6, show: config.edgeControls?.top ?? true},
			{mi: 7, c1: 6, c2: 0, show: config.edgeControls?.left ?? true},
		]
			.filter(({show}) => show)
			.map(({mi, c1, c2}) => ({
				conceptualEdgeControlIndex: mi,
				corner1CI: c1,
				corner2CI: c2,
			}));
	}

	// Push all four corner local-space points to the drawing tools.
	public flushRectPoints(
		localPoints: vec3[],
		drawingTools: IDrawingToolsApi,
		temporary: boolean,
	): void {
		// Build an overrides map with all target positions so that
		// applyConstraints sees the correct (not stale) values for points
		// that haven't been flushed yet in this loop iteration.
		const overrides = new Map<number, vec3>();
		for (let di = 0; di < this.dtToConceptual.length; di++) {
			const ci = this.dtToConceptual[di];
			const p = localPoints[ci];
			overrides.set(di, vec3.fromValues(p[0], p[1], p[2]));
		}
		for (let di = 0; di < this.dtToConceptual.length; di++) {
			const ci = this.dtToConceptual[di];
			const p = localPoints[ci];
			drawingTools.movePoint(
				di,
				[p[0], p[1], p[2]],
				temporary,
				overrides,
			);
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
	edgeControls?: {
		top?: boolean; // M5: top edge
		bottom?: boolean; // M1: bottom edge
		left?: boolean; // M7: left edge
		right?: boolean; // M3: right edge
	};
};
