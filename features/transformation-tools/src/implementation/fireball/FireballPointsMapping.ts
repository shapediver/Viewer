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

	constructor(config: PointVisibilityConfig = {}) {
		const showC0 = config.enableCornerXNegativeYNegative ?? true; // BL
		const showC2 = config.enableCornerXPositiveYNegative ?? true; // BR
		const showC4 = config.enableCornerXPositiveYPositive ?? true; // TR
		const showC6 = config.enableCornerXNegativeYPositive ?? true; // TL
		const showM1 = config.enableMidpointYNegative ?? true; // bottom
		const showM3 = config.enableMidpointXPositive ?? true; // right
		const showM5 = config.enableMidpointYPositive ?? true; // top
		const showM7 = config.enableMidpointXNegative ?? true; // left

		const dtToConceptual: number[] = [];
		const conceptualToDT: number[] = new Array(8).fill(-1);

		const visible: Record<number, boolean> = {
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
			if (!visible[ci]) continue;
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
	enableCornerXNegativeYNegative?: boolean; // C0: BL
	enableCornerXPositiveYNegative?: boolean; // C2: BR
	enableCornerXPositiveYPositive?: boolean; // C4: TR
	enableCornerXNegativeYPositive?: boolean; // C6: TL
	enableMidpointXPositive?: boolean; // M3: right edge
	enableMidpointXNegative?: boolean; // M7: left edge
	enableMidpointYPositive?: boolean; // M5: top edge
	enableMidpointYNegative?: boolean; // M1: bottom edge
};
