import {IViewportApi} from "@shapediver/viewer";
import {
	AdjacencyEntry,
	createDrawingTools,
	IControl,
	IDrawingToolsApi,
	PlaneRestrictionProperties,
} from "@shapediver/viewer.features.drawing-tools";
import {RESTRICTION_TYPE} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";

import {vec3} from "gl-matrix";

import {RectangleTransformSettings} from "../../interfaces/rectangleTransform/IRectangleTransform";
import {IRectangleTransformHandler} from "./IRectangleTransformHandler";
import {
	PointVisibilityConfig,
	RectangleTransformPointsMapping,
} from "./RectangleTransformPointsMapping";

export class RectangleTransformScalingHandler
	implements IRectangleTransformHandler
{
	readonly #drawingTools: IDrawingToolsApi;
	readonly #scalingConfig: RectangleTransformSettings["scaling"];
	readonly #pointsMapping: RectangleTransformPointsMapping;

	constructor(
		viewport: IViewportApi,
		parentNode: ITreeNode,
		localPoints: vec3[],
		visibilityConfig: PointVisibilityConfig,
		scalingConfig: RectangleTransformSettings["scaling"],
	) {
		this.#scalingConfig = scalingConfig;
		this.#pointsMapping = new RectangleTransformPointsMapping(
			visibilityConfig,
		);

		const vis = scalingConfig?.visualization;

		// XY-plane restriction in parent-local space (the parent node carries the
		// plane-to-world transform, so the DT operates entirely in plane-LS).
		const lsRestriction: PlaneRestrictionProperties = {
			type: RESTRICTION_TYPE.PLANE,
			origin: vec3.create(),
			vector_u: vec3.fromValues(1, 0, 0),
			vector_v: vec3.fromValues(0, 1, 0),
			createHelperObjects: false,
		};

		// If step is configured, add a grid snap restriction to the plane restriction
		if (scalingConfig?.step) {
			lsRestriction.gridSnapRestriction = {
				gridUnit: scalingConfig.step,
				enabled: true,
				enableVisualization: false,
				createHelperObjects: false,
			};
		}

		// All four corners in order: C0(DT0), C2(DT1), C4(DT2), C6(DT3).
		const dtLSPoints = this.#pointsMapping.dtToConceptual.map((ci) => {
			const p = localPoints[ci];
			return [p[0], p[1], p[2]] as [number, number, number];
		});

		// EdgeControls: each controls the midpoint of an edge and has a fixed direction.
		const controls: IControl[] = this.#pointsMapping.edgeControls.map(
			({conceptualEdgeControlIndex, corner1CI, corner2CI}) => {
				const di1 = this.#pointsMapping.conceptualToDT[corner1CI];
				const di2 = this.#pointsMapping.conceptualToDT[corner2CI];
				// Direction perpendicular to the edge in plane-LS:
				//   U-edges (M1, M5, horizontal) → V-axis (0,1,0)
				//   V-edges (M3, M7, vertical)   → U-axis (1,0,0)
				const isUEdge = conceptualEdgeControlIndex % 4 === 1;
				const direction = isUEdge
					? vec3.fromValues(0, 1, 0)
					: vec3.fromValues(1, 0, 0);
				return {
					type: "edge" as const,
					point1: di1,
					point2: di2,
					direction,
				};
			},
		) as unknown as IControl[];

		// Build weightedAdjacency: locked corners are excluded as both sources and
		// targets so that adjacency propagation never moves a locked corner.
		// C0(BL)→C6(TL):[1,0,0], C0→C2(BR):[0,1,0]
		// C2(BR)→C4(TR):[1,0,0], C2→C0(BL):[0,1,0]
		// C4(TR)→C2(BR):[1,0,0], C4→C6(TL):[0,1,0]
		// C6(TL)→C0(BL):[1,0,0], C6→C4(TR):[0,1,0]
		const cornerAdjDefs: Array<{ci: number; sameU: number; sameV: number}> =
			[
				{ci: 0, sameU: 6, sameV: 2},
				{ci: 2, sameU: 4, sameV: 0},
				{ci: 4, sameU: 2, sameV: 6},
				{ci: 6, sameU: 0, sameV: 4},
			];
		const lockedSet = new Set(
			this.#pointsMapping.lockedCornerConceptualIndices,
		);
		const weightedAdjacency: AdjacencyEntry[][] = dtLSPoints.map(() => []);
		for (const {ci, sameU, sameV} of cornerAdjDefs) {
			if (lockedSet.has(ci)) continue;
			const di = this.#pointsMapping.conceptualToDT[ci];
			const diU = this.#pointsMapping.conceptualToDT[sameU];
			const diV = this.#pointsMapping.conceptualToDT[sameV];
			if (!lockedSet.has(sameU))
				weightedAdjacency[di].push({
					to: diU,
					weights: [1, 0, 0],
					space: "local",
				});
			if (!lockedSet.has(sameV))
				weightedAdjacency[di].push({
					to: diV,
					weights: [0, 1, 0],
					space: "local",
				});
		}

		this.#drawingTools = createDrawingTools(
			viewport,
			{
				onUpdate: () => {},
				onCancel: () => {},
			},
			{
				general: {
					enableInsertion: false,
					enableDeletion: false,
					enableSelection: false,
				},
				geometry: {
					mode: "lines",
					points: dtLSPoints,
					close: true,
					minPoints: dtLSPoints.length,
					maxPoints: dtLSPoints.length,
					weightedAdjacency,
					disabledPoints:
						this.#pointsMapping.disabledDTIndices.length > 0
							? this.#pointsMapping.disabledDTIndices
							: undefined,
					constraints:
						RectangleTransformScalingHandler.buildSizeConstraints(
							scalingConfig,
						),
				},
				controls,
				restrictions: {plane: lsRestriction},
				visualization: {
					distanceMultiplicationFactor: 1.2,
					distanceLabels: false,
					pointerPosition: false,
					...vis,
					points: {
						size_0: 30,
						size_1: 35,
						size_2: 30,
						size_3: 35,
						color: "#0d44f0",
						size_6: 20,
						color_6: "#888888",
						...vis?.points,
					},
					lines: {color: "#0d44f0", ...vis?.lines},
					edgeControlVisualization: {
						points: {
							size_0: 25,
							size_1: 30,
							size_2: 25,
							size_3: 30,
							color: "#0d44f0",
							...(vis?.edgeControlVisualization?.points ??
								vis?.points),
						},
						lines: {
							color: "#0d44f0",
							...(vis?.edgeControlVisualization?.lines ??
								vis?.lines),
						},
					},
				},
			},
			undefined,
			parentNode,
		);
	}

	public get drawingTools(): IDrawingToolsApi {
		return this.#drawingTools;
	}

	public get pointsMapping(): RectangleTransformPointsMapping {
		return this.#pointsMapping;
	}

	public close(): void {
		this.#drawingTools.close();
	}

	public recompute(localPoints: vec3[], temporary: boolean): void {
		this.flushRectPoints(localPoints, temporary);
	}

	/**
	 * Read back the corner positions currently stored in the drawing tool (after
	 * any constraints have been applied) and return a full 8-point conceptual
	 * local-space array.  Call this after `recompute` during creation so that
	 * `#localPoints` in RectangleTransform reflects the constrained state.
	 */
	public readbackConstrainedPoints(): vec3[] {
		const dtPoints = this.#drawingTools.pointsData;
		const fullPoints: vec3[] = new Array(8);
		for (let di = 0; di < this.#pointsMapping.dtToConceptual.length; di++) {
			const ci = this.#pointsMapping.dtToConceptual[di];
			const p = dtPoints[di];
			fullPoints[ci] = vec3.fromValues(p[0], p[1], p[2]);
		}
		// Recompute midpoints as averages of their adjacent corners.
		fullPoints[1] = vec3.fromValues(
			(fullPoints[0][0] + fullPoints[2][0]) / 2,
			(fullPoints[0][1] + fullPoints[2][1]) / 2,
			0,
		);
		fullPoints[3] = vec3.fromValues(
			(fullPoints[2][0] + fullPoints[4][0]) / 2,
			(fullPoints[2][1] + fullPoints[4][1]) / 2,
			0,
		);
		fullPoints[5] = vec3.fromValues(
			(fullPoints[4][0] + fullPoints[6][0]) / 2,
			(fullPoints[4][1] + fullPoints[6][1]) / 2,
			0,
		);
		fullPoints[7] = vec3.fromValues(
			(fullPoints[6][0] + fullPoints[0][0]) / 2,
			(fullPoints[6][1] + fullPoints[0][1]) / 2,
			0,
		);
		return fullPoints;
	}

	/**
	 * Handle a corner drag.
	 * The DT has already propagated the drag delta to the two adjacent corners
	 * via weightedAdjacency (space: "local") and applied size constraints.
	 * This method reads the DT-updated positions and applies uniform scaling
	 * on top when configured.
	 */
	public cornerPointMoved(
		index: number,
		updatedDtPoints: number[][],
		localPoints: vec3[],
	): vec3[] {
		// Read all 4 corner positions from the DT (adjacency + constraints
		// already applied by the drawing tools).
		let c0 = this.getCornerFromDT(0, updatedDtPoints, localPoints);
		let c2 = this.getCornerFromDT(2, updatedDtPoints, localPoints);
		let c4 = this.getCornerFromDT(4, updatedDtPoints, localPoints);
		let c6 = this.getCornerFromDT(6, updatedDtPoints, localPoints);

		if (this.#scalingConfig?.uniform) {
			const n = index / 2;
			const controlsLeft = n === 0 || n === 3;
			const controlsBottom = n < 2;

			const prev = localPoints[index];
			const moved = this.getCornerFromDT(
				index,
				updatedDtPoints,
				localPoints,
			);
			const signX = controlsLeft ? -1 : 1;
			const signY = controlsBottom ? -1 : 1;
			const deltaX = signX * (moved[0] - prev[0]);
			const deltaY = signY * (moved[1] - prev[1]);
			const d = Math.abs(deltaX) < Math.abs(deltaY) ? deltaX : deltaY;
			const adjustedX = prev[0] + signX * d;
			const adjustedY = prev[1] + signY * d;

			if (controlsLeft) {
				c0 = vec3.fromValues(adjustedX, c0[1], 0);
				c6 = vec3.fromValues(adjustedX, c6[1], 0);
			} else {
				c2 = vec3.fromValues(adjustedX, c2[1], 0);
				c4 = vec3.fromValues(adjustedX, c4[1], 0);
			}
			if (controlsBottom) {
				c0 = vec3.fromValues(c0[0], adjustedY, 0);
				c2 = vec3.fromValues(c2[0], adjustedY, 0);
			} else {
				c4 = vec3.fromValues(c4[0], adjustedY, 0);
				c6 = vec3.fromValues(c6[0], adjustedY, 0);
			}
		}

		return RectangleTransformScalingHandler.buildFullPoints(c0, c2, c4, c6);
	}

	/**
	 * Flush all four corner points to the single drawing tool.
	 * EdgeControl handles (midpoints) are automatically repositioned by the DT.
	 */
	public flushRectPoints(localPoints: vec3[], temporary: boolean): void {
		this.#pointsMapping.flushRectPoints(
			localPoints,
			this.#drawingTools,
			temporary,
		);
	}

	/**
	 * Handle an EdgeControl (midpoint) drag.
	 * The drawing tools have already moved the two corner points for the dragged
	 * edge (with constraints applied). This method reads the DT-updated positions
	 * and applies uniform scaling on top when configured.
	 */
	public controlMoved(
		controlIndex: number,
		updatedDtPoints: number[][],
		localPoints: vec3[],
	): vec3[] {
		// Read all 4 corner positions from the DT (already moved by EdgeControl
		// + constrained by the drawing tools).
		let c0 = this.getCornerFromDT(0, updatedDtPoints, localPoints);
		let c2 = this.getCornerFromDT(2, updatedDtPoints, localPoints);
		let c4 = this.getCornerFromDT(4, updatedDtPoints, localPoints);
		let c6 = this.getCornerFromDT(6, updatedDtPoints, localPoints);

		if (this.#scalingConfig?.uniform) {
			const {conceptualEdgeControlIndex} =
				this.#pointsMapping.edgeControls[controlIndex];
			const isUEdge = conceptualEdgeControlIndex % 4 === 1;

			const origC0 = localPoints[0];
			const origC2 = localPoints[2];
			const origC4 = localPoints[4];
			const origC6 = localPoints[6];

			if (isUEdge) {
				// Height (Y) changed; expand width symmetrically about center X.
				const heightChange = c6[1] - c0[1] - (origC6[1] - origC0[1]);
				const halfWidthChange = heightChange / 2;
				const centerX = (origC0[0] + origC2[0]) / 2;
				const prevHalfWidth = (origC2[0] - origC0[0]) / 2;
				const newLeft = centerX - prevHalfWidth - halfWidthChange;
				const newRight = centerX + prevHalfWidth + halfWidthChange;
				c0 = vec3.fromValues(newLeft, c0[1], 0);
				c2 = vec3.fromValues(newRight, c2[1], 0);
				c4 = vec3.fromValues(newRight, c4[1], 0);
				c6 = vec3.fromValues(newLeft, c6[1], 0);
			} else {
				// Width (X) changed; expand height symmetrically about center Y.
				const widthChange = c2[0] - c0[0] - (origC2[0] - origC0[0]);
				const halfHeightChange = widthChange / 2;
				const centerY = (origC0[1] + origC6[1]) / 2;
				const prevHalfHeight = (origC6[1] - origC0[1]) / 2;
				const newBottom = centerY - prevHalfHeight - halfHeightChange;
				const newTop = centerY + prevHalfHeight + halfHeightChange;
				c0 = vec3.fromValues(c0[0], newBottom, 0);
				c2 = vec3.fromValues(c2[0], newBottom, 0);
				c4 = vec3.fromValues(c4[0], newTop, 0);
				c6 = vec3.fromValues(c6[0], newTop, 0);
			}
		}

		return RectangleTransformScalingHandler.buildFullPoints(c0, c2, c4, c6);
	}

	/**
	 * Build the DT constraints.size object from uMin/uMax/vMin/vMax.
	 * Maps undefined bounds to 0 (for min) or Infinity (for max) so a
	 * one-sided constraint can still be expressed as a [number, number] tuple.
	 */
	private static buildSizeConstraints(
		cfg: RectangleTransformSettings["scaling"],
	): {size: {x?: [number, number]; y?: [number, number]}} | undefined {
		const hasX =
			(cfg?.uMin !== undefined && cfg?.uMin !== null) ||
			(cfg?.uMax !== undefined && cfg?.uMax !== null);
		const hasY =
			(cfg?.vMin !== undefined && cfg?.vMin !== null) ||
			(cfg?.vMax !== undefined && cfg?.vMax !== null);
		if (!hasX && !hasY) return undefined;
		return {
			size: {
				...(hasX ? {x: [cfg!.uMin ?? 0, cfg!.uMax ?? Infinity]} : {}),
				...(hasY ? {y: [cfg!.vMin ?? 0, cfg!.vMax ?? Infinity]} : {}),
			},
		};
	}

	/**
	 * Read a conceptual corner position from the DT's updated points array.
	 * Falls back to localPoints when the corner has no DT representation
	 * (e.g. locked/disabled).
	 */
	private getCornerFromDT(
		conceptualIndex: number,
		updatedDtPoints: number[][],
		localPoints: vec3[],
	): vec3 {
		const di = this.#pointsMapping.conceptualToDT[conceptualIndex];
		if (di >= 0) {
			return vec3.fromValues(
				updatedDtPoints[di][0],
				updatedDtPoints[di][1],
				0,
			);
		}
		return vec3.clone(localPoints[conceptualIndex]);
	}

	/**
	 * Build the full 8-point conceptual array (4 corners + 4 midpoints) from
	 * corner positions in plane local space.
	 */
	private static buildFullPoints(
		c0: vec3,
		c2: vec3,
		c4: vec3,
		c6: vec3,
	): vec3[] {
		const pts: vec3[] = new Array(8);
		pts[0] = c0;
		pts[2] = c2;
		pts[4] = c4;
		pts[6] = c6;
		for (let i = 1; i < 8; i += 2) {
			pts[i] = vec3.fromValues(
				(pts[(i + 7) % 8][0] + pts[(i + 1) % 8][0]) / 2,
				(pts[(i + 7) % 8][1] + pts[(i + 1) % 8][1]) / 2,
				0,
			);
		}
		return pts;
	}
}
