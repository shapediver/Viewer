import {IViewportApi} from "@shapediver/viewer";
import {
	IDrawingToolsApi,
	PlaneRestrictionProperties,
	createDrawingTools,
} from "@shapediver/viewer.features.drawing-tools";
import {IVisualizationSettings} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";

import {vec3} from "gl-matrix";

import {
	RectFrameCoord,
	cornersToFullPoints,
	getRectBasis,
	toRectFrame,
} from "./FireballGeometry";
import {
	FireballPointsMapping,
	PointVisibilityConfig,
} from "./FireballPointsMapping";

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

export class FireballScalingHandler {
	// Interactive handles DT — only enabled/active points, mode "points".
	readonly #drawingTools: IDrawingToolsApi;
	readonly #scalingConfig: ScalingConfig;
	// Locked corners DT — disabled corners shown as grey non-interactive dots.
	readonly #lockedDT: IDrawingToolsApi | undefined;
	// Outline DT — all 8 conceptual points in order, mode "lines", invisible handles.
	readonly #outlineDT: IDrawingToolsApi;
	readonly #plane: Plane;
	readonly #pointsMapping: FireballPointsMapping;

	constructor(
		viewport: IViewportApi,
		planeRestriction: PlaneRestrictionProperties,
		plane: Plane,
		localPoints: vec3[],
		visibilityConfig: PointVisibilityConfig,
		scalingConfig: ScalingConfig,
	) {
		this.#scalingConfig = scalingConfig;
		this.#plane = plane;
		this.#pointsMapping = new FireballPointsMapping(visibilityConfig);

		const vis = scalingConfig.visualization;

		// --- 1. Outline DT: all 8 conceptual points, lines only, invisible handles ---
		const allWorldPoints = localPoints.map((p) => {
			const wp = plane.convertFromLSToWS(p);
			return [wp[0], wp[1], wp[2]];
		});
		this.#outlineDT = createDrawingTools(
			viewport,
			{onUpdate: () => {}, onCancel: () => {}},
			{
				general: {
					enableTranslation: false,
					enableInsertion: false,
					enableDeletion: false,
					enableSelection: false,
				},
				geometry: {
					mode: "lines",
					points: allWorldPoints,
					close: true,
					minPoints: allWorldPoints.length,
					maxPoints: allWorldPoints.length,
				},
				restrictions: {plane: planeRestriction},
				visualization: {
					distanceLabels: false,
					pointerPosition: false,
					...vis,
					points: {
						// Zero size makes handles invisible and effectively non-clickable.
						size_0: 0,
						size_1: 0,
						size_2: 0,
						size_3: 0,
						...vis?.points,
					},
					lines: {color: "#0d44f0", ...vis?.lines},
				},
			},
		);

		const disabledVis = scalingConfig.disabledVisualization;
		// --- 2. Locked corners DT: disabled corners, grey style, non-interactive ---
		// Created BEFORE the interactive DT so its onMove fires first and the
		// #blockingHoverInstances set is populated before the interactive DT
		// processes hover, preventing nearby interactive handles from lighting up
		// while the cursor is over a locked corner.
		const lockedCIs = this.#pointsMapping.lockedCornerConceptualIndices;
		if (lockedCIs.length > 0) {
			const lockedWorldPoints = lockedCIs.map((ci) => {
				const wp = plane.convertFromLSToWS(localPoints[ci]);
				return [wp[0], wp[1], wp[2]];
			});
			this.#lockedDT = createDrawingTools(
				viewport,
				{onUpdate: () => {}, onCancel: () => {}},
				{
					general: {
						enableTranslation: false,
						enableInsertion: false,
						enableDeletion: false,
						enableSelection: false,
					},
					geometry: {
						mode: "points",
						points: lockedWorldPoints,
						minPoints: lockedWorldPoints.length,
						maxPoints: lockedWorldPoints.length,
					},
					restrictions: {plane: planeRestriction},
					visualization: {
						distanceLabels: false,
						pointerPosition: false,
						...disabledVis,
						points: {
							size_0: 20,
							size_1: 20,
							size_2: 20,
							size_3: 20,
							color_0: "#888888",
							color_1: "#888888",
							color_2: "#888888",
							color_3: "#888888",
							...disabledVis?.points,
						},
					},
				},
			);
		}

		// --- 3. Interactive handles DT: enabled active points only, mode "points" ---
		const dtWorldPoints = this.#pointsMapping.dtToConceptual.map((ci) => {
			const wp = plane.convertFromLSToWS(localPoints[ci]);
			return [wp[0], wp[1], wp[2]];
		});
		this.#drawingTools = createDrawingTools(
			viewport,
			{
				onUpdate: (pointsData, metaData) => {
					console.log("Points data:", pointsData);
					console.log("Meta data:", metaData);
				},
				onCancel: () => {
					console.log("Drawing tool cancelled");
				},
			},
			{
				general: {
					enableInsertion: false,
					enableDeletion: false,
					enableSelection: false,
				},
				geometry: {
					mode: "points",
					points: dtWorldPoints,
					minPoints: dtWorldPoints.length,
					maxPoints: dtWorldPoints.length,
				},
				restrictions: {plane: planeRestriction},
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
						...vis?.points,
					},
				},
			},
		);
	}

	public get drawingTools(): IDrawingToolsApi {
		return this.#drawingTools;
	}

	public get pointsMapping(): FireballPointsMapping {
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
		this.#outlineDT.close();
		this.#drawingTools.close();
		this.#lockedDT?.close();
	}

	/**
	 * Handle a corner drag.
	 * n=0->C0: controls left U and bottom V
	 * n=1->C2: controls right U and bottom V
	 * n=2->C4: controls right U and top V
	 * n=3->C6: controls left U and top V
	 */
	public cornerPointMoved(
		index: number,
		movedPointLS: vec3,
		localPoints: vec3[],
	): vec3[] {
		const cfg = this.#scalingConfig;
		const basis = getRectBasis(localPoints);
		const movedUV = toRectFrame(movedPointLS, basis);

		// Get the current UV coordinates of the 4 corners.
		let c0uv = toRectFrame(localPoints[0], basis);
		let c2uv = toRectFrame(localPoints[2], basis);
		let c4uv = toRectFrame(localPoints[4], basis);
		let c6uv = toRectFrame(localPoints[6], basis);

		// Determine which corner is being moved and which edges it controls.
		const n = index / 2;
		const controlsLeft = n === 0 || n === 3;
		const controlsBottom = n < 2;

		let du = movedUV.u;
		let dv = movedUV.v;

		// If uniform scaling is enabled, adjust the moved corner's UV to maintain the aspect ratio.
		if (cfg.uniform) {
			const prevUV = toRectFrame(localPoints[index], basis);
			const signU = controlsLeft ? -1 : 1;
			const signV = controlsBottom ? -1 : 1;
			const adjusted = this.scaleUniformly(prevUV, movedUV, signU, signV);
			du = adjusted.u;
			dv = adjusted.v;
		}

		// Apply axis locks: if x is disabled, don't change U; if y is disabled, don't change V.
		if (!cfg.x) {
			du = controlsLeft ? c0uv.u : c2uv.u;
		}
		if (!cfg.y) {
			dv = controlsBottom ? c0uv.v : c4uv.v;
		}

		if (controlsLeft) {
			c0uv = {u: du, v: c0uv.v};
			c6uv = {u: du, v: c6uv.v};
		} else {
			c2uv = {u: du, v: c2uv.v};
			c4uv = {u: du, v: c4uv.v};
		}
		if (controlsBottom) {
			c0uv = {u: c0uv.u, v: dv};
			c2uv = {u: c2uv.u, v: dv};
		} else {
			c4uv = {u: c4uv.u, v: dv};
			c6uv = {u: c6uv.u, v: dv};
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
	 * Flush all visible conceptual local-space points to the drawing tools.
	 * @param localPoints
	 * @param temporary
	 */
	public flushRectPoints(localPoints: vec3[], temporary: boolean): void {
		// Update the outline DT (all 8 points; DT index === conceptual index).
		for (let i = 0; i < 8; i++) {
			const wp = this.#plane.convertFromLSToWS(localPoints[i]);
			this.#outlineDT.movePoint(i, [wp[0], wp[1], wp[2]], temporary);
		}

		// Update the interactive handles DT.
		this.#pointsMapping.flushRectPoints(
			localPoints,
			this.#drawingTools,
			this.#plane,
			temporary,
		);

		// Update the locked corners DT.
		if (this.#lockedDT) {
			const lockedCIs = this.#pointsMapping.lockedCornerConceptualIndices;
			for (let i = 0; i < lockedCIs.length; i++) {
				const wp = this.#plane.convertFromLSToWS(
					localPoints[lockedCIs[i]],
				);
				this.#lockedDT.movePoint(i, [wp[0], wp[1], wp[2]], temporary);
			}
		}
	}

	/**
	 * Handle a mid-point drag.
	 * M1,M5 lie on U-axis edges -> only V coordinate changes (scale in V).
	 * M3,M7 lie on V-axis edges -> only U coordinate changes (scale in U).
	 */
	public midPointMoved(
		index: number,
		movedPointLS: vec3,
		localPoints: vec3[],
	): vec3[] {
		const cfg = this.#scalingConfig;
		const basis = getRectBasis(localPoints);
		const n = (index - 1) / 2;
		// Mids on U edges (M1,M5) control V scaling, mids on V edges (M3,M7) control U scaling.
		const isUEdge = n % 2 === 0;

		// Axis lock: mid on a U-edge controls Y; mid on a V-edge controls X.
		if (isUEdge && !cfg.y) return localPoints.map((p) => vec3.clone(p));
		if (!isUEdge && !cfg.x) return localPoints.map((p) => vec3.clone(p));

		const movedUV = toRectFrame(movedPointLS, basis);

		// Get the current UV coordinates of the 4 corners.
		// C0=BL, C2=BR, C4=TR, C6=TL
		let c0uv = toRectFrame(localPoints[0], basis);
		let c2uv = toRectFrame(localPoints[2], basis);
		let c4uv = toRectFrame(localPoints[4], basis);
		let c6uv = toRectFrame(localPoints[6], basis);

		// Apply primary edge movement.
		if (isUEdge) {
			if (index === 1) {
				c0uv = {u: c0uv.u, v: movedUV.v};
				c2uv = {u: c2uv.u, v: movedUV.v};
			} else {
				c4uv = {u: c4uv.u, v: movedUV.v};
				c6uv = {u: c6uv.u, v: movedUV.v};
			}
		} else {
			if (index === 3) {
				c2uv = {u: movedUV.u, v: c2uv.v};
				c4uv = {u: movedUV.u, v: c4uv.v};
			} else {
				c0uv = {u: movedUV.u, v: c0uv.v};
				c6uv = {u: movedUV.u, v: c6uv.v};
			}
		}

		// For uniform scaling, expand the perpendicular edges symmetrically by
		// 50% of the primary delta so the rectangle grows from its center.
		if (cfg.uniform) {
			const prevUV = toRectFrame(localPoints[index], basis);
			if (isUEdge) {
				const dV = movedUV.v - prevUV.v;
				// M1 pulled down (dV<0) increases height; M5 pulled up (dV>0) increases height.
				const heightIncrease = index === 1 ? -dV : dV;
				const perp = heightIncrease / 2;
				c0uv = {u: c0uv.u - perp, v: c0uv.v};
				c2uv = {u: c2uv.u + perp, v: c2uv.v};
				c4uv = {u: c4uv.u + perp, v: c4uv.v};
				c6uv = {u: c6uv.u - perp, v: c6uv.v};
			} else {
				const dU = movedUV.u - prevUV.u;
				// M3 pulled right (dU>0) increases width; M7 pulled left (dU<0) increases width.
				const widthIncrease = index === 3 ? dU : -dU;
				const perp = widthIncrease / 2;
				c0uv = {u: c0uv.u, v: c0uv.v - perp};
				c2uv = {u: c2uv.u, v: c2uv.v - perp};
				c4uv = {u: c4uv.u, v: c4uv.v + perp};
				c6uv = {u: c6uv.u, v: c6uv.v + perp};
			}
		}

		const result = cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
		// Anchor the non-moving edge: U-edge mids only change V, V-edge mids only change U.
		const anchorU: "left" | "right" | "center" = isUEdge
			? "center"
			: index === 3
				? "left"
				: "right";
		const anchorV: "bottom" | "top" | "center" = isUEdge
			? index === 1
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
