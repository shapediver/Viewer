import {IViewportApi} from "@shapediver/viewer";
import {
	AdjacencyEntry,
	createDrawingTools,
	IControl,
	IDrawingToolsApi,
	PlaneRestrictionProperties,
} from "@shapediver/viewer.features.drawing-tools";
import {
	IVisualizationSettings,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";

import {vec3} from "gl-matrix";

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

function snapValue(value: number, step: number, threshold: number): number {
	const nearest = Math.round(value / step) * step;
	return Math.abs(value - nearest) <= threshold ? nearest : value;
}

export type ScalingConfig = {
	uniform: boolean;
	x: boolean;
	y: boolean;
	xMin: number | undefined;
	xMax: number | undefined;
	yMin: number | undefined;
	yMax: number | undefined;
	step: number | undefined;
	stepThreshold: number | undefined;
	visualization: Partial<IVisualizationSettings> | undefined;
	disabledVisualization: Partial<IVisualizationSettings> | undefined;
};

export class RectangleTransformScalingHandler {
	readonly #drawingTools: IDrawingToolsApi;
	readonly #scalingConfig: ScalingConfig;
	readonly #plane: Plane;
	readonly #pointsMapping: RectangleTransformPointsMapping;

	constructor(
		viewport: IViewportApi,
		parentNode: ITreeNode,
		plane: Plane,
		localPoints: vec3[],
		visibilityConfig: PointVisibilityConfig,
		scalingConfig: ScalingConfig,
	) {
		this.#scalingConfig = scalingConfig;
		this.#plane = plane;
		this.#pointsMapping = new RectangleTransformPointsMapping(
			visibilityConfig,
		);

		const vis = scalingConfig.visualization;
		const disabledVis = scalingConfig.disabledVisualization;

		// XY-plane restriction in parent-local space (the parent node carries the
		// plane-to-world transform, so the DT operates entirely in plane-LS).
		const lsRestriction: PlaneRestrictionProperties = {
			type: RESTRICTION_TYPE.PLANE,
			origin: vec3.create(),
			vector_u: vec3.fromValues(1, 0, 0),
			vector_v: vec3.fromValues(0, 1, 0),
		};

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

		// Merge disabled-vis into state-6 (DISABLED material index).
		// Accept either the new size_6/color_6 keys directly, or fall back to
		// the legacy state-0 keys that callers may have used with the old
		// separate locked-corners DT.
		const disabledSize =
			disabledVis?.points?.size_6 ??
			disabledVis?.points?.size_0 ??
			20;
		const disabledColor =
			disabledVis?.points?.color_6 ??
			disabledVis?.points?.color_0 ??
			"#888888";

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
				},
				controls,
				restrictions: {plane: lsRestriction},
				visualization: {
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
						size_6: disabledSize,
						color_6: disabledColor,
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

	/**
	 * Apply configured clamp/snap constraints to an initial rectangle.
	 * Uses center anchoring so initialization does not drift.
	 */
	public applyInitialConstraints(localPoints: vec3[]): vec3[] {
		return this.clampAndSnap(localPoints, localPoints, "center", "center");
	}

	public close(): void {
		this.#drawingTools.close();
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
		const cfg = this.#scalingConfig;
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

		if (cfg.uniform) {
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

		if (!cfg.x) {
			const leftU = toRectFrame(localPoints[0], basis).u;
			const rightU = toRectFrame(localPoints[2], basis).u;
			c0uv = {u: leftU, v: c0uv.v};
			c6uv = {u: leftU, v: c6uv.v};
			c2uv = {u: rightU, v: c2uv.v};
			c4uv = {u: rightU, v: c4uv.v};
		}
		if (!cfg.y) {
			const bottomV = toRectFrame(localPoints[0], basis).v;
			const topV = toRectFrame(localPoints[4], basis).v;
			c0uv = {u: c0uv.u, v: bottomV};
			c2uv = {u: c2uv.u, v: bottomV};
			c4uv = {u: c4uv.u, v: topV};
			c6uv = {u: c6uv.u, v: topV};
		}

		const result = cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
		return this.clampAndSnap(
			result,
			localPoints,
			controlsLeft ? "right" : "left",
			controlsBottom ? "top" : "bottom",
		);
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
		const cfg = this.#scalingConfig;
		const {conceptualMidIndex, corner1CI, corner2CI} =
			this.#pointsMapping.midpointEdges[controlIndex];
		// M1,M5 are on U-axis edges (horizontal) → only V changes.
		// M3,M7 are on V-axis edges (vertical)   → only U changes.
		const isUEdge = conceptualMidIndex % 4 === 1;

		// Axis lock
		if (isUEdge && !cfg.y) return localPoints.map((p) => vec3.clone(p));
		if (!isUEdge && !cfg.x) return localPoints.map((p) => vec3.clone(p));

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

		const result = cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
		const anchorU: "left" | "right" | "center" = isUEdge
			? "center"
			: conceptualMidIndex === 3
				? "left"
				: "right";
		const anchorV: "bottom" | "top" | "center" = isUEdge
			? conceptualMidIndex === 1
				? "top"
				: "bottom"
			: "center";
		return this.clampAndSnap(result, localPoints, anchorU, anchorV);
	}

	/**
	 * Clamp rectangle dimensions to [xMin,xMax] x [yMin,yMax] (in world space) and snap to
	 * step increments (also in world space). The rectangle is resized from the specified anchor
	 * so the non-moving side stays in place.
	 */
	private clampAndSnap(
		points: vec3[],
		prevPoints: vec3[],
		anchorU: "left" | "right" | "center",
		anchorV: "bottom" | "top" | "center",
	): vec3[] {
		const cfg = this.#scalingConfig;
		const hasClamp =
			cfg.xMin !== undefined ||
			cfg.xMax !== undefined ||
			cfg.yMin !== undefined ||
			cfg.yMax !== undefined;
		const hasSnap = cfg.step !== undefined;
		if (!hasClamp && !hasSnap) return points;

		const basis = getRectBasis(prevPoints);
		const c0 = toRectFrame(points[0], basis);
		const c2 = toRectFrame(points[2], basis);
		const c4 = toRectFrame(points[4], basis);

		const lsWidth = c2.u - c0.u;
		const lsHeight = c4.v - c0.v;

		// Measure world-space dimensions (xMin/xMax/yMin/yMax/step are all in world units).
		// p0=BL, p2=BR, p6=TL — bottom edge gives X width, left edge gives Y height.
		const p0ws = this.#plane.convertFromLSToWS(points[0]);
		const p2ws = this.#plane.convertFromLSToWS(points[2]);
		const p6ws = this.#plane.convertFromLSToWS(points[6]);
		const origWsWidth = vec3.distance(p0ws, p2ws);
		const origWsHeight = vec3.distance(p0ws, p6ws);

		let wsWidth = origWsWidth;
		let wsHeight = origWsHeight;

		if (hasSnap) {
			const step = cfg.step!;
			const threshold = cfg.stepThreshold ?? step / 2;
			wsWidth = snapValue(wsWidth, step, threshold);
			wsHeight = snapValue(wsHeight, step, threshold);
		}

		if (cfg.xMin !== undefined) wsWidth = Math.max(cfg.xMin, wsWidth);
		if (cfg.xMax !== undefined) wsWidth = Math.min(cfg.xMax, wsWidth);
		if (cfg.yMin !== undefined) wsHeight = Math.max(cfg.yMin, wsHeight);
		if (cfg.yMax !== undefined) wsHeight = Math.min(cfg.yMax, wsHeight);

		// Convert target world-space dimensions back to local space via the WS/LS ratio.
		const width =
			origWsWidth > 0 ? lsWidth * (wsWidth / origWsWidth) : lsWidth;
		const height =
			origWsHeight > 0 ? lsHeight * (wsHeight / origWsHeight) : lsHeight;

		// Place the clamped rectangle while keeping the non-moving side anchored.
		let leftU: number, rightU: number;
		if (anchorU === "left") {
			leftU = c0.u;
			rightU = leftU + width;
		} else if (anchorU === "right") {
			rightU = c2.u;
			leftU = rightU - width;
		} else {
			const cu = (c0.u + c2.u) / 2;
			leftU = cu - width / 2;
			rightU = cu + width / 2;
		}

		let bottomV: number, topV: number;
		if (anchorV === "bottom") {
			bottomV = c0.v;
			topV = bottomV + height;
		} else if (anchorV === "top") {
			topV = c4.v;
			bottomV = topV - height;
		} else {
			const cv = (c0.v + c4.v) / 2;
			bottomV = cv - height / 2;
			topV = cv + height / 2;
		}

		return cornersToFullPoints(
			[
				{u: leftU, v: bottomV},
				{u: rightU, v: bottomV},
				{u: rightU, v: topV},
				{u: leftU, v: topV},
			],
			basis,
		);
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
