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
	cornersToFullPoints,
	getRectBasis,
	RectFrameCoord,
	toRectFrame,
} from "./RectangleTransformGeometry";
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

		// Midpoint controls: each controls the midpoint of an edge and has a fixed direction.
		const controls: IControl[] = this.#pointsMapping.midpointEdges.map(
			({conceptualMidIndex, corner1CI, corner2CI}) => {
				const di1 = this.#pointsMapping.conceptualToDT[corner1CI];
				const di2 = this.#pointsMapping.conceptualToDT[corner2CI];
				// Direction perpendicular to the edge in plane-LS:
				//   U-edges (M1, M5, horizontal) → V-axis (0,1,0)
				//   V-edges (M3, M7, vertical)   → U-axis (1,0,0)
				const isUEdge = conceptualMidIndex % 4 === 1;
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
				weightedAdjacency[di].push({to: diU, weights: [1, 0, 0]});
			if (!lockedSet.has(sameV))
				weightedAdjacency[di].push({to: diV, weights: [0, 1, 0]});
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
						color_0: "#0d44f0",
						color_1: "#0d44f0",
						color_2: "#0d44f0",
						color_3: "#0d44f0",
						size_6: 20,
						color_6: "#888888",
						...vis?.points,
					},
					lines: {color: "#0d44f0", ...vis?.lines},
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
	 * via weightedAdjacency ([1,0,0] for the shared-U neighbor, [0,1,0] for the
	 * shared-V neighbor). This method reads those DT-updated positions and applies
	 * uniform scaling, axis locks, and clamp/snap on top.
	 */
	public cornerPointMoved(
		index: number,
		updatedDtPoints: number[][],
		localPoints: vec3[],
	): vec3[] {
		const basis = getRectBasis(localPoints);
		const n = index / 2;
		const controlsLeft = n === 0 || n === 3;
		const controlsBottom = n < 2;

		// Read corner position from DT (already propagated) or fall back to localPoints
		// for locked corners that have no DT slot.
		const readCorner = (ci: number): RectFrameCoord => {
			const di = this.#pointsMapping.conceptualToDT[ci];
			if (di >= 0) {
				const p = updatedDtPoints[di];
				return toRectFrame(vec3.fromValues(p[0], p[1], p[2]), basis);
			}
			return toRectFrame(localPoints[ci], basis);
		};

		let c0uv = readCorner(0);
		let c2uv = readCorner(2);
		let c4uv = readCorner(4);
		let c6uv = readCorner(6);

		if (this.#scalingConfig?.uniform) {
			const prevUV = toRectFrame(localPoints[index], basis);
			const movedUV =
				index === 0
					? c0uv
					: index === 2
						? c2uv
						: index === 4
							? c4uv
							: c6uv;
			const signU = controlsLeft ? -1 : 1;
			const signV = controlsBottom ? -1 : 1;
			const adjusted = this.scaleUniformly(prevUV, movedUV, signU, signV);
			if (controlsLeft) {
				c0uv = {u: adjusted.u, v: c0uv.v};
				c6uv = {u: adjusted.u, v: c6uv.v};
			} else {
				c2uv = {u: adjusted.u, v: c2uv.v};
				c4uv = {u: adjusted.u, v: c4uv.v};
			}
			if (controlsBottom) {
				c0uv = {u: c0uv.u, v: adjusted.v};
				c2uv = {u: c2uv.u, v: adjusted.v};
			} else {
				c4uv = {u: c4uv.u, v: adjusted.v};
				c6uv = {u: c6uv.u, v: adjusted.v};
			}
		}

		return cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
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
	 * edge; this method reads their new positions from the updated DT points
	 * array, reconstructs the rectangle, and applies axis-lock and clamp/snap.
	 */
	public controlMoved(
		controlIndex: number,
		updatedDtPoints: number[][],
		localPoints: vec3[],
	): vec3[] {
		const {conceptualMidIndex, corner1CI, corner2CI} =
			this.#pointsMapping.midpointEdges[controlIndex];
		// M1,M5 are on U-axis edges (horizontal) → only V changes.
		// M3,M7 are on V-axis edges (vertical)   → only U changes.
		const isUEdge = conceptualMidIndex % 4 === 1;

		const basis = getRectBasis(localPoints);
		const di1 = this.#pointsMapping.conceptualToDT[corner1CI];
		const di2 = this.#pointsMapping.conceptualToDT[corner2CI];

		// Use the midpoint of the two moved corners as the effective dragged position.
		const rp1 = updatedDtPoints[di1];
		const rp2 = updatedDtPoints[di2];
		const midLS = vec3.fromValues(
			(rp1[0] + rp2[0]) / 2,
			(rp1[1] + rp2[1]) / 2,
			(rp1[2] + rp2[2]) / 2,
		);
		const movedUV = toRectFrame(midLS, basis);

		let c0uv = toRectFrame(localPoints[0], basis);
		let c2uv = toRectFrame(localPoints[2], basis);
		let c4uv = toRectFrame(localPoints[4], basis);
		let c6uv = toRectFrame(localPoints[6], basis);

		// Snapshot original bounds needed for uniform-scaling calculation below.
		const origBottomV = c0uv.v;
		const origTopV = c6uv.v;
		const origLeftU = c0uv.u;
		const origRightU = c2uv.u;

		if (isUEdge) {
			if (conceptualMidIndex === 1) {
				c0uv = {u: c0uv.u, v: movedUV.v};
				c2uv = {u: c2uv.u, v: movedUV.v};
			} else {
				c4uv = {u: c4uv.u, v: movedUV.v};
				c6uv = {u: c6uv.u, v: movedUV.v};
			}
		} else {
			if (conceptualMidIndex === 3) {
				c2uv = {u: movedUV.u, v: c2uv.v};
				c4uv = {u: movedUV.u, v: c4uv.v};
			} else {
				c0uv = {u: movedUV.u, v: c0uv.v};
				c6uv = {u: movedUV.u, v: c6uv.v};
			}
		}

		if (this.#scalingConfig?.uniform) {
			if (isUEdge) {
				// Height changed; expand width by the same amount, symmetric about center U.
				const halfWidthChange =
					(c6uv.v - c0uv.v - (origTopV - origBottomV)) / 2;
				const centerU = (origLeftU + origRightU) / 2;
				const prevHalfWidth = (origRightU - origLeftU) / 2;
				c0uv = {
					u: centerU - prevHalfWidth - halfWidthChange,
					v: c0uv.v,
				};
				c2uv = {
					u: centerU + prevHalfWidth + halfWidthChange,
					v: c2uv.v,
				};
				c4uv = {
					u: centerU + prevHalfWidth + halfWidthChange,
					v: c4uv.v,
				};
				c6uv = {
					u: centerU - prevHalfWidth - halfWidthChange,
					v: c6uv.v,
				};
			} else {
				// Width changed; expand height by the same amount, symmetric about center V.
				const halfHeightChange =
					(c2uv.u - c0uv.u - (origRightU - origLeftU)) / 2;
				const centerV = (origBottomV + origTopV) / 2;
				const prevHalfHeight = (origTopV - origBottomV) / 2;
				c0uv = {
					u: c0uv.u,
					v: centerV - prevHalfHeight - halfHeightChange,
				};
				c2uv = {
					u: c2uv.u,
					v: centerV - prevHalfHeight - halfHeightChange,
				};
				c4uv = {
					u: c4uv.u,
					v: centerV + prevHalfHeight + halfHeightChange,
				};
				c6uv = {
					u: c6uv.u,
					v: centerV + prevHalfHeight + halfHeightChange,
				};
			}
		}

		return cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
	}

	/**
	 * Build the DT constraints.size object from uMin/uMax/vMin/vMax.
	 * Maps undefined bounds to 0 (for min) or Infinity (for max) so a
	 * one-sided constraint can still be expressed as a [number, number] tuple.
	 */
	private static buildSizeConstraints(
		cfg: RectangleTransformSettings["scaling"],
	): {size: {x?: [number, number]; y?: [number, number]}} | undefined {
		const hasX = cfg?.uMin !== undefined || cfg?.uMax !== undefined;
		const hasY = cfg?.vMin !== undefined || cfg?.vMax !== undefined;
		if (!hasX && !hasY) return undefined;
		return {
			size: {
				...(hasX ? {x: [cfg!.uMin ?? 0, cfg!.uMax ?? Infinity]} : {}),
				...(hasY ? {y: [cfg!.vMin ?? 0, cfg!.vMax ?? Infinity]} : {}),
			},
		};
	}

	/**
	 * Scale the rectangle uniformly by adjusting the moved corner's UV coordinates to maintain the aspect ratio.
	 */
	private scaleUniformly(
		prevUV: RectFrameCoord,
		movedUV: RectFrameCoord,
		signU: number,
		signV: number,
	): RectFrameCoord {
		const deltaU = signU * (movedUV.u - prevUV.u);
		const deltaV = signV * (movedUV.v - prevUV.v);
		const d = Math.abs(deltaU) < Math.abs(deltaV) ? deltaU : deltaV;
		return {u: prevUV.u + signU * d, v: prevUV.v + signV * d};
	}
}
