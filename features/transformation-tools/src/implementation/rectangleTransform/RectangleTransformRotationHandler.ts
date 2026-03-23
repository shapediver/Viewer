import {IMapData, IViewportApi, MaterialEngine} from "@shapediver/viewer";
import {
	createDrawingTools,
	IDrawingToolsApi,
	IDrawingToolsEvent,
} from "@shapediver/viewer.features.drawing-tools";
import {
	IVisualizationSettings,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";

import {vec3} from "gl-matrix";

const rotationDefaultTextures: {[key: string]: Promise<IMapData> | IMapData} =
	{};

rotationDefaultTextures["variation_0"] = MaterialEngine.instance
	.loadMap("https://viewer.shapediver.com/v3/graphics/refresh.png")
	.then((mapData: IMapData | undefined) => {
		rotationDefaultTextures["variation_0"] = mapData!;
		return mapData!;
	});

export type RotationConfig = {
	/** Step size in radians. */
	step: number | undefined;
	/** Snap threshold in radians. */
	stepThreshold: number | undefined;
	/** Minimum cumulative angle in radians (enforced externally). */
	min: number | undefined;
	/** Maximum cumulative angle in radians (enforced externally). */
	max: number | undefined;
	/**
	 * Distance of the rotation handle above the top edge, as a fraction of the rectangle's height.
	 * Default is 0.25.
	 */
	handleDistance: number;
	/** Visualization settings for the rotation handle. */
	visualization: Partial<IVisualizationSettings> | undefined;
};

function snapAngle(angle: number, step: number, threshold: number): number {
	const nearest = Math.round(angle / step) * step;
	return Math.abs(angle - nearest) <= threshold ? nearest : angle;
}

function normalizeSignedAngle(angle: number): number {
	let normalized = angle;
	while (normalized > Math.PI) normalized -= 2 * Math.PI;
	while (normalized < -Math.PI) normalized += 2 * Math.PI;
	return normalized;
}

export class RectangleTransformRotationHandler {
	readonly #drawingTools: IDrawingToolsApi;
	readonly #handleDistance: number;
	readonly #rotationConfig: RotationConfig;

	#handleLocalPoint: vec3;

	constructor(
		viewport: IViewportApi,
		parentNode: ITreeNode,
		localPoints: vec3[],
		rotationConfig: RotationConfig = {
			step: undefined,
			stepThreshold: undefined,
			min: undefined,
			max: undefined,
			handleDistance: 0.25,
			visualization: undefined,
		},
	) {
		this.#handleDistance = rotationConfig.handleDistance;
		this.#rotationConfig = rotationConfig;

		// Place the handle above the top edge (M5) by handleDistance * height
		const min = localPoints[0]; // C0 in local space (bottom-left)
		const max = localPoints[4]; // C4 in local space (top-right)
		const rotHandleDist = (max[1] - min[1]) * this.#handleDistance;
		this.#handleLocalPoint = vec3.fromValues(
			(min[0] + max[0]) / 2,
			max[1] + rotHandleDist,
			0,
		);

		// XY-plane restriction in parent-local space.
		const rotVis = rotationConfig.visualization;
		this.#drawingTools = createDrawingTools(
			viewport,
			{onUpdate: () => {}, onCancel: () => {}},
			{
				general: {
					enableInsertion: false,
					enableDeletion: false,
					enableSelection: false,
				},
				geometry: {
					mode: "points",
					points: [
						[
							this.#handleLocalPoint[0],
							this.#handleLocalPoint[1],
							this.#handleLocalPoint[2],
						],
					],
					minPoints: 1,
					maxPoints: 1,
				},
				restrictions: {
					plane: {
						type: RESTRICTION_TYPE.PLANE,
						origin: vec3.create(),
						vector_u: vec3.fromValues(1, 0, 0),
						vector_v: vec3.fromValues(0, 1, 0),
					},
				},
				visualization: {
					distanceLabels: false,
					pointerPosition: false,
					...rotVis,
					points: {
						size_0: 50,
						size_1: 50,
						size_2: 50,
						size_3: 50,
						color_0: "#000",
						color_1: "#000",
						color_2: "#000",
						color_3: "#000",
						...rotVis?.points,
					},
				},
			},
			rotationDefaultTextures,
			parentNode,
		);
	}

	public get drawingTools(): IDrawingToolsApi {
		return this.#drawingTools;
	}

	public get handleLocalPoint(): vec3 {
		return this.#handleLocalPoint;
	}

	/**
	 * Apply the drag result by updating the handle position and moving the drawing-tools point.
	 * @param newHandle
	 * @param temporary
	 */
	public applyDrag(newHandle: vec3, temporary: boolean): void {
		this.#handleLocalPoint = newHandle;
		this.#drawingTools.movePoint(
			0,
			[newHandle[0], newHandle[1], newHandle[2]],
			temporary,
		);
	}

	/**
	 * Process a drag event on the rotation handle, computing the new rectangle points and handle position.
	 * Returns the deltaAngle (in radians, after snapping) so the caller can track cumulative rotation.
	 */
	public computeDrag(
		ev: IDrawingToolsEvent,
		localPoints: vec3[],
	): {rotated: vec3[]; newHandle: vec3; deltaAngle: number} {
		const newHandleLS = vec3.fromValues(
			ev.points![0][0],
			ev.points![0][1],
			ev.points![0][2],
		);

		const cx = (localPoints[0][0] + localPoints[4][0]) / 2;
		const cy = (localPoints[0][1] + localPoints[4][1]) / 2;

		const currVec = vec3.subtract(
			vec3.create(),
			this.#handleLocalPoint,
			vec3.fromValues(cx, cy, 0),
		);
		const newVec = vec3.subtract(
			vec3.create(),
			newHandleLS,
			vec3.fromValues(cx, cy, 0),
		);

		const deltaAngle = normalizeSignedAngle(
			Math.atan2(newVec[1], newVec[0]) -
				Math.atan2(currVec[1], currVec[0]),
		);

		const {rotated, newHandle} = this.rotatePoints(
			localPoints,
			cx,
			cy,
			deltaAngle,
		);
		return {rotated, newHandle, deltaAngle};
	}

	/**
	 * Snap a cumulative angle to the nearest configured step increment.
	 * If no step is configured, returns the angle unchanged.
	 */
	public snapCumulative(cumulative: number): number {
		const {step, stepThreshold} = this.#rotationConfig;
		if (step === undefined) return cumulative;
		return snapAngle(cumulative, step, stepThreshold ?? step / 2);
	}

	/**
	 * Rotate localPoints by an explicit angle (radians) around their center.
	 * Used by RectangleTransform to apply the clamped delta after min/max enforcement.
	 */
	public computeDragByAngle(
		localPoints: vec3[],
		deltaAngle: number,
		startHandle?: vec3,
	): {rotated: vec3[]; newHandle: vec3} {
		const cx = (localPoints[0][0] + localPoints[4][0]) / 2;
		const cy = (localPoints[0][1] + localPoints[4][1]) / 2;
		return this.rotatePoints(localPoints, cx, cy, deltaAngle, startHandle);
	}

	private rotatePoints(
		localPoints: vec3[],
		cx: number,
		cy: number,
		deltaAngle: number,
		startHandle?: vec3,
	): {rotated: vec3[]; newHandle: vec3} {
		const cos = Math.cos(deltaAngle);
		const sin = Math.sin(deltaAngle);

		const rotated = localPoints.map((p) => {
			const du = p[0] - cx;
			const dv = p[1] - cy;
			return vec3.fromValues(
				cx + du * cos - dv * sin,
				cy + du * sin + dv * cos,
				0,
			);
		});

		const h = startHandle ?? this.#handleLocalPoint;
		const dhU = h[0] - cx;
		const dhV = h[1] - cy;
		const newHandle = vec3.fromValues(
			cx + dhU * cos - dhV * sin,
			cy + dhU * sin + dhV * cos,
			0,
		);

		return {rotated, newHandle};
	}

	/**
	 * Recompute the handle position based on the new rectangle points, and move the drawing-tools point accordingly.
	 * @param localPoints
	 * @param temporary
	 */
	public recompute(localPoints: vec3[], temporary: boolean): void {
		const center = vec3.fromValues(
			(localPoints[0][0] + localPoints[4][0]) / 2,
			(localPoints[0][1] + localPoints[4][1]) / 2,
			0,
		);
		const m5 = localPoints[5];
		const dist = 2 * this.#handleDistance;
		const newHandle = vec3.fromValues(
			m5[0] + dist * (m5[0] - center[0]),
			m5[1] + dist * (m5[1] - center[1]),
			0,
		);
		this.#handleLocalPoint = newHandle;
		this.#drawingTools.movePoint(
			0,
			[newHandle[0], newHandle[1], newHandle[2]],
			temporary,
		);
	}
}
