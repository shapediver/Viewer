import {IMapData, IViewportApi, MaterialEngine} from "@shapediver/viewer";
import {
	createDrawingTools,
	IDrawingToolsApi,
	IDrawingToolsEvent,
} from "@shapediver/viewer.features.drawing-tools";
import {RESTRICTION_TYPE} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";

import {mat4, vec3} from "gl-matrix";
import {RectangleTransformSettings} from "../../interfaces/rectangleTransform/IRectangleTransform";
import {IRectangleTransformHandler} from "./IRectangleTransformHandler";

const rotationDefaultTextures: {[key: string]: Promise<IMapData> | IMapData} =
	{};

rotationDefaultTextures["variation_0"] = MaterialEngine.instance
	.loadMap("https://viewer.shapediver.com/v3/graphics/refresh.png")
	.then((mapData: IMapData | undefined) => {
		rotationDefaultTextures["variation_0"] = mapData!;
		return mapData!;
	});

function snapAngle(angle: number, step: number, threshold: number): number {
	const nearest = Math.round(angle / step) * step;
	return Math.abs(angle - nearest) <= threshold ? nearest : angle;
}

function normalizeSignedAngle(angle: number): number {
	return (((angle % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
}

export class RectangleTransformRotationHandler
	implements IRectangleTransformHandler
{
	readonly #drawingTools: IDrawingToolsApi;
	readonly #handleDistance: number;
	readonly #rotationConfig: RectangleTransformSettings["rotation"];
	readonly #onMove: (rotated: vec3[]) => void;
	readonly #onCommit: (localPoints: vec3[]) => void;

	#handleLocalPoint: vec3;

	// Running cumulative rotation used for min/max enforcement and snapping.
	#cumulativeRotation: number = 0;
	// Accumulated rotation expressed as a matrix (plane-LS). Each committed
	// gesture is composed on top of the previous one, so multiple rotations
	// with different centers (e.g. after asymmetric scaling) are handled
	// correctly without collapsing them to a single angle + single center.
	#M_accumulatedRotation: mat4 = mat4.create();
	// Cumulative rotation and center captured at the START of each gesture
	// (preserved across clearDragState so syncAccumulatedToCumulative can use
	// them when pointer-out fires mid-gesture).
	#gestureStartCumulative: number = 0;
	#gestureCenter: vec3 = vec3.create();
	// Drag-start snapshot captured on the first DRAG_MOVE of each gesture.
	#dragStart:
		| {localPoints: vec3[]; handle: vec3; cumulative: number}
		| undefined = undefined;

	constructor(
		viewport: IViewportApi,
		parentNode: ITreeNode,
		localPoints: vec3[],
		rotationConfig: RectangleTransformSettings["rotation"] = {
			step: undefined,
			stepThreshold: undefined,
			min: undefined,
			max: undefined,
			handleDistance: 0.25,
			visualization: undefined,
		},
		onMove: (rotated: vec3[]) => void = () => {},
		onCommit: (localPoints: vec3[]) => void = () => {},
	) {
		this.#onMove = onMove;
		this.#onCommit = onCommit;
		this.#handleDistance = rotationConfig.handleDistance ?? 0.25;
		this.#rotationConfig = {
			step:
				rotationConfig?.step !== undefined &&
				rotationConfig?.step !== null
					? rotationConfig.step * (Math.PI / 180)
					: undefined,
			stepThreshold:
				rotationConfig?.stepThreshold !== undefined &&
				rotationConfig?.stepThreshold !== null
					? rotationConfig.stepThreshold * (Math.PI / 180)
					: undefined,
			min:
				rotationConfig?.min !== undefined &&
				rotationConfig?.min !== null
					? rotationConfig.min * (Math.PI / 180)
					: undefined,
			max:
				rotationConfig?.max !== undefined &&
				rotationConfig?.max !== null
					? rotationConfig.max * (Math.PI / 180)
					: undefined,
			handleDistance: rotationConfig?.handleDistance ?? 0.25,
			visualization: rotationConfig?.visualization,
		};

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
						createHelperObjects: false,
					},
				},
				visualization: {
					distanceMultiplicationFactor: 1,
					distanceLabels: false,
					pointerPosition: false,
					...rotVis,
					points: {
						size_0: 50,
						size_1: 50,
						size_2: 50,
						size_3: 50,
						color: "#000",
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

	public get accumulatedRotationMatrix(): mat4 {
		return this.#M_accumulatedRotation;
	}

	/**
	 * Clear the drag-start snapshot at the end of a gesture.
	 */
	public clearDragState(): void {
		this.#dragStart = undefined;
	}

	public close(): void {
		this.#drawingTools.close();
	}

	/**
	 * Sync accumulated to cumulative — called on pointer-out to commit any
	 * in-progress gesture without a proper DRAG_END.
	 */
	public syncAccumulatedToCumulative(): void {
		const deltaAngle =
			this.#cumulativeRotation - this.#gestureStartCumulative;
		if (deltaAngle !== 0) {
			this.#composeDeltaIntoMatrix(this.#gestureCenter, deltaAngle);
		}
		// Advance the gesture baseline so a second call is idempotent.
		this.#gestureStartCumulative = this.#cumulativeRotation;
	}

	/**
	 * Process a drag event: runs the full snapping/clamping pipeline and calls
	 * onMove (temporary drag-move) or onCommit (drag-end) as appropriate.
	 */
	public processDrag(
		ev: IDrawingToolsEvent,
		localPoints: vec3[],
		commit: boolean,
	): void {
		this.#beginDrag(localPoints);

		const {deltaAngle: rawDelta} = this.computeDrag(ev, localPoints);

		const rawNext = this.#cumulativeRotation + rawDelta;
		const snappedNext = this.#snapCumulative(rawNext);
		const finalNext = this.#clampAngle(snappedNext);

		if (finalNext === this.#cumulativeRotation) {
			// Angle unchanged: only commit the parent matrix on DRAG_END so the
			// object does not reset (DRAG_END almost always hits this branch).
			if (commit) {
				this.#commitAndFlush(finalNext, localPoints);
			} else if (this.#rotationConfig?.step !== undefined) {
				// When a step is configured, keep the handle pinned at the current
				// snapped position so the DT point does not drift with the raw cursor.
				this.#applyDrag(this.#handleLocalPoint, true);
			}
			return;
		}

		const drag = this.#dragStart!;
		const absoluteDelta = finalNext - drag.cumulative;
		const {rotated, newHandle} = this.computeDragByAngle(
			drag.localPoints,
			absoluteDelta,
			drag.handle,
		);

		this.#cumulativeRotation = finalNext;

		if (commit) {
			// On commit: bake rotation into the parent matrix and flush canonical
			// (axis-aligned) DT positions — the parent matrix now carries the rotation.
			this.#commitAndFlush(finalNext, localPoints);
		} else {
			// On drag-move: temporarily move DT points so the viewport renders them
			// at the rotated positions without updating the parent matrix yet.
			this.#applyDrag(newHandle, true);
			this.#onMove(rotated);
		}
	}

	// Commit + recompute + notify — shared by the unchanged-angle and changed-angle commit paths.
	#commitAndFlush(finalNext: number, localPoints: vec3[]): void {
		const center = vec3.fromValues(
			(localPoints[0][0] + localPoints[4][0]) / 2,
			(localPoints[0][1] + localPoints[4][1]) / 2,
			0,
		);
		const deltaAngle = finalNext - this.#gestureStartCumulative;
		console.log(
			"[ROT-COMMIT] commitAndFlush | cumulativeDeg:",
			+((finalNext * 180) / Math.PI).toFixed(2),
			"| deltaAngleDeg:",
			+((deltaAngle * 180) / Math.PI).toFixed(2),
			"| localPoints c0:",
			Array.from(localPoints[0]).map((v) => +v.toFixed(4)),
			"c2:",
			Array.from(localPoints[2]).map((v) => +v.toFixed(4)),
			"c4:",
			Array.from(localPoints[4]).map((v) => +v.toFixed(4)),
			"c6:",
			Array.from(localPoints[6]).map((v) => +v.toFixed(4)),
		);
		if (deltaAngle !== 0) {
			this.#composeDeltaIntoMatrix(center, deltaAngle);
		}
		// Advance baseline so the next gesture starts from the right offset.
		this.#gestureStartCumulative = finalNext;
		this.#dragStart = undefined;
		this.recompute(localPoints, false);
		this.#onCommit(localPoints);
	}

	#composeDeltaIntoMatrix(center: vec3, deltaAngle: number): void {
		const negCenter = vec3.negate(vec3.create(), center);
		const M_delta = mat4.multiply(
			mat4.create(),
			mat4.fromTranslation(mat4.create(), center),
			mat4.multiply(
				mat4.create(),
				mat4.fromZRotation(mat4.create(), deltaAngle),
				mat4.fromTranslation(mat4.create(), negCenter),
			),
		);
		mat4.multiply(
			this.#M_accumulatedRotation,
			this.#M_accumulatedRotation,
			M_delta,
		);
	}

	#beginDrag(localPoints: vec3[]): void {
		if (this.#dragStart !== undefined) return;
		this.#gestureStartCumulative = this.#cumulativeRotation;
		this.#gestureCenter = vec3.fromValues(
			(localPoints[0][0] + localPoints[4][0]) / 2,
			(localPoints[0][1] + localPoints[4][1]) / 2,
			0,
		);
		this.#dragStart = {
			localPoints: localPoints.map((p) => vec3.clone(p)),
			handle: vec3.clone(this.#handleLocalPoint),
			cumulative: this.#cumulativeRotation,
		};
	}

	#applyDrag(newHandle: vec3, temporary: boolean): void {
		this.#handleLocalPoint = newHandle;
		this.#drawingTools.movePoint(
			0,
			[newHandle[0], newHandle[1], newHandle[2]],
			temporary,
		);
	}

	#clampAngle(snappedNext: number): number {
		const {min, max} = this.#rotationConfig!;
		if (min !== undefined && max !== undefined)
			return Math.min(max, Math.max(min, snappedNext));
		if (min !== undefined) return Math.max(min, snappedNext);
		if (max !== undefined) return Math.min(max, snappedNext);
		return snappedNext;
	}

	#snapCumulative(cumulative: number): number {
		const {step, stepThreshold} = this.#rotationConfig!;
		if (step === undefined) return cumulative;
		return snapAngle(cumulative, step, stepThreshold ?? step / 2);
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
	 * @deprecated Use processDrag which handles snapping internally.
	 */
	public snapCumulative(cumulative: number): number {
		return this.#snapCumulative(cumulative);
	}

	/**
	 * Rotate localPoints by an explicit angle (radians) around their center.
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
