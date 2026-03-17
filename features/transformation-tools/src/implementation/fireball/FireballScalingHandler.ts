import {IViewportApi} from "@shapediver/viewer";
import {
	IDrawingToolsApi,
	PlaneRestrictionProperties,
	createDrawingTools,
} from "@shapediver/viewer.features.drawing-tools";
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

export class FireballScalingHandler {
	readonly #drawingTools: IDrawingToolsApi;
	readonly #enableUniformScaling: boolean;
	readonly #plane: Plane;
	readonly #pointsMapping: FireballPointsMapping;

	constructor(
		viewport: IViewportApi,
		planeRestriction: PlaneRestrictionProperties,
		plane: Plane,
		localPoints: vec3[],
		visibilityConfig: PointVisibilityConfig,
		enableUniformScaling: boolean,
	) {
		this.#enableUniformScaling = enableUniformScaling;
		this.#plane = plane;
		this.#pointsMapping = new FireballPointsMapping(visibilityConfig);

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
				general: {},
				geometry: {
					mode: "lines",
					points: dtWorldPoints,
					close: true,
					minPoints: dtWorldPoints.length,
					maxPoints: dtWorldPoints.length,
				},
				restrictions: {
					plane: planeRestriction,
				},
				visualization: {
					distanceLabels: false,
					pointerPosition: false,
					points: {
						size_0: 30,
						size_1: 35,
						size_2: 30,
						size_3: 35,
						color_0: "#0d44f0",
						color_1: "#0d44f0",
						color_2: "#0d44f0",
						color_3: "#0d44f0",
					},
					lines: {
						color: "#0d44f0",
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
	 * Handle a corner drag.
	 * n=0->C0: controls left U and bottom V
	 * n=1->C2: controls right U and bottom V
	 * n=2->C4: controls right U and top V
	 * n=3->C6: controls left U and top V
	 * @param index
	 * @param movedPointLS
	 * @param localPoints
	 * @returns
	 */
	public cornerPointMoved(
		index: number,
		movedPointLS: vec3,
		localPoints: vec3[],
	): vec3[] {
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
		if (this.#enableUniformScaling) {
			const prevUV = toRectFrame(localPoints[index], basis);
			const signU = controlsLeft ? -1 : 1;
			const signV = controlsBottom ? -1 : 1;
			const adjusted = this.scaleUniformly(prevUV, movedUV, signU, signV);
			du = adjusted.u;
			dv = adjusted.v;
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

		return cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
	}

	/**
	 * Flush all visible conceptual local-space points to the drawing tools.
	 * @param localPoints
	 * @param temporary
	 */
	public flushRectPoints(localPoints: vec3[], temporary: boolean): void {
		this.#pointsMapping.flushRectPoints(
			localPoints,
			this.#drawingTools,
			this.#plane,
			temporary,
		);
	}

	/**
	 * Handle a mid-point drag.
	 * M1,M5 lie on U-axis edges -> only V coordinate changes (scale in V).
	 * M3,M7 lie on V-axis edges -> only U coordinate changes (scale in U).
	 * @param index
	 * @param movedPointLS
	 * @param localPoints
	 * @returns
	 */
	public midPointMoved(
		index: number,
		movedPointLS: vec3,
		localPoints: vec3[],
	): vec3[] {
		const basis = getRectBasis(localPoints);
		const n = (index - 1) / 2;
		// Mids on U edges (M1,M5) control V scaling, mids on V edges (M3,M7) control U scaling.
		const isUEdge = n % 2 === 0;

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
		if (this.#enableUniformScaling) {
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

		return cornersToFullPoints([c0uv, c2uv, c4uv, c6uv], basis);
	}

	/**
	 * Scale the rectangle uniformly by adjusting the moved corner's UV coordinates to maintain the aspect ratio.
	 * @param prevUV
	 * @param movedUV
	 * @param signU
	 * @param signV
	 * @returns
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
