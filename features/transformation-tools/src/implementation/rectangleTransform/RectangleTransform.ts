import {Box, IViewportApi, sceneTree, TreeNode} from "@shapediver/viewer";
import {
	IDrawingToolsEvent,
	PlaneRestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.features.drawing-tools";
import {RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";
import {ITransformation, ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
} from "@shapediver/viewer.shared.services";

import {mat4, vec3} from "gl-matrix";

import {
	IRectangleTransform,
	RectangleTransformSettings,
	RectangleTransformSettingsOptional,
} from "../../interfaces/rectangleTransform/IRectangleTransform";
import {TransformationToolsManager} from "../TransformationToolsManager";
import {RectangleTransformRotationHandler} from "./RectangleTransformRotationHandler";
import {RectangleTransformScalingHandler} from "./RectangleTransformScalingHandler";
import {RectangleTransformTranslationHandler} from "./RectangleTransformTranslationHandler";

export class RectangleTransform
	extends TransformationToolsManager
	implements IRectangleTransform
{
	readonly #currentTransformationMatrix: mat4 = mat4.create();
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #plane: Plane;

	// Parent node shared by all drawing-tool instances. Its local transform
	// represents the accumulated plane-to-WS + rotation + translation, so DT
	// points are always stored in plane-local space and no manual LS↔WS
	// conversions are needed.
	#dtParentNode!: ITreeNode;
	readonly #dtParentTransformation: ITransformation = {
		id: "SD_rect_dt_parent",
		matrix: mat4.create(),
	};
	// The initial (static) plane-to-WS matrix – used as the base for composing
	// accumulated rotation / translation transforms.
	#M_planeToWS: mat4 = mat4.create();
	// Accumulated rotation angle (radians) across all committed gestures.
	#accumulatedRotation: number = 0;
	// Accumulated translation (in plane-LS) across all committed gestures.
	#committedTranslation: vec3 = vec3.create();
	// The plane-LS pivot used for all rotation matrix builds. Updated only at
	// rotation commit so that a subsequent scaling (which shifts #localPoints
	// center) does not silently change the effective rotation pivot and cause
	// an object jump when translation drag-move fires applyAccumulatedTransform.
	#rotationCenter: vec3 = vec3.create();

	#dragEndListener: string;
	#dragMoveListener: string;
	#hasPendingTemporaryTransform: boolean = false;
	#initialLocalPoints: vec3[] = [];
	#localPoints: vec3[] = [];
	#rotationHandler: RectangleTransformRotationHandler | undefined;
	#scalingHandler: RectangleTransformScalingHandler | undefined;
	#translationHandler: RectangleTransformTranslationHandler | undefined;
	#scalingConfig: RectangleTransformSettings["scaling"];
	#rotationConfig: RectangleTransformSettings["rotation"];
	// Accumulated rotation angle in radians, used to enforce rotation.min/max.
	#cumulativeRotation: number = 0;

	// Drag-start state: captured at the first DRAG_MOVE of each gesture so that
	// every frame rotates by a single clean matrix from the start position,
	// preventing floating-point drift from many incremental multiplications.
	#dragStartLocalPoints: vec3[] | undefined = undefined;
	#dragStartHandle: vec3 | undefined = undefined;
	#dragStartCumulative: number = 0;

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: RectangleTransformSettingsOptional,
	) {
		super(viewport, nodes, settings);

		const planeDefinition = this.settings?.plane;
		const planeRestriction: PlaneRestrictionProperties = !planeDefinition
			? {
					type: RESTRICTION_TYPE.PLANE,
					origin: vec3.fromValues(0, 0, 0),
					vector_u: vec3.fromValues(1, 0, 0),
					vector_v: vec3.fromValues(0, 1, 0),
				}
			: {
					// Clone vec3 values to prevent in-place mutation by internal drawing-tools processing
					...planeDefinition,
					origin: vec3.clone(planeDefinition.origin!),
					vector_u: vec3.clone(planeDefinition.vector_u!),
					vector_v: vec3.clone(planeDefinition.vector_v!),
				};

		this.#plane = new Plane(
			planeRestriction.vector_u!,
			planeRestriction.vector_v!,
			-vec3.dot(
				vec3.normalize(
					vec3.create(),
					vec3.cross(
						vec3.create(),
						planeRestriction.vector_u!,
						planeRestriction.vector_v!,
					),
				),
				planeRestriction.origin!,
			),
		);
		const sc = settings!.scaling;
		this.#scalingConfig = {
			uniform: sc?.uniform ?? false,
			xMin: sc?.xMin,
			xMax: sc?.xMax,
			yMin: sc?.yMin,
			yMax: sc?.yMax,
			visualization: sc?.visualization,
		};
		const rc = settings!.rotation;
		this.#rotationConfig = {
			step:
				rc?.step !== undefined ? rc.step * (Math.PI / 180) : undefined,
			stepThreshold:
				rc?.stepThreshold !== undefined
					? rc.stepThreshold * (Math.PI / 180)
					: undefined,
			min: rc?.min !== undefined ? rc.min * (Math.PI / 180) : undefined,
			max: rc?.max !== undefined ? rc.max * (Math.PI / 180) : undefined,
			handleDistance: rc?.handleDistance ?? 0.25,
			visualization: rc?.visualization,
		};

		this.init();

		this.#dragMoveListener = this.#eventEngine.addListener(
			EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE,
			(e) => this.dispatchDrag(e as IDrawingToolsEvent, false),
		);
		this.#dragEndListener = this.#eventEngine.addListener(
			EVENTTYPE_DRAWING_TOOLS.DRAG_END,
			(e) => this.dispatchDrag(e as IDrawingToolsEvent, true),
		);
	}

	public get settings(): RectangleTransformSettingsOptional | undefined {
		return super.settings;
	}

	public get type(): "rectangleTransform" {
		return "rectangleTransform";
	}

	protected get transformationToolsPlaceholderMatrix(): mat4 {
		return this.#currentTransformationMatrix;
	}

	protected closeLogic(): void {
		this.#eventEngine.removeListener(this.#dragMoveListener);
		this.#eventEngine.removeListener(this.#dragEndListener);

		this.#rotationHandler?.drawingTools.close();
		this.#scalingHandler?.close();
		this.#translationHandler?.close();

		sceneTree.root.removeChild(this.#dtParentNode);
		sceneTree.root.updateVersion(false, false);
	}

	protected onPointerOutLogic(_event: PointerEvent): void {
		this.#dragStartLocalPoints = undefined;
		this.#dragStartHandle = undefined;

		if (!this.#hasPendingTemporaryTransform) return;

		// Commit any in-progress rotation to the parent matrix before flushing
		// canonical positions, otherwise calculateTransformationMatrix writes
		// identity and the object resets.
		this.#accumulatedRotation = this.#cumulativeRotation;
		this.applyAccumulatedTransform(
			this.#accumulatedRotation,
			this.#committedTranslation,
		);
		this.#scalingHandler?.flushRectPoints(this.#localPoints, false);
		this.#rotationHandler?.recompute(this.#localPoints, false);
		this.#translationHandler?.updatePlane(this.#localPoints);
		this.calculateTransformationMatrix(this.#localPoints, true);
		this.#hasPendingTemporaryTransform = false;
	}

	private calculateTransformationMatrix(
		localPoints: vec3[],
		commit: boolean,
	): void {
		// Derive a general 2D affine in the plane's local space that maps
		// the initial rectangle to the current one using corners C0, C2, C6.
		const newC0 = localPoints[0];
		const newC2 = localPoints[2];
		const newC6 = localPoints[6];
		const initC0 = this.#initialLocalPoints[0];
		const initW =
			this.#initialLocalPoints[2][0] - this.#initialLocalPoints[0][0];
		const initH =
			this.#initialLocalPoints[6][1] - this.#initialLocalPoints[0][1];

		// New basis columns (handle scale + rotation)
		const aU = (newC2[0] - newC0[0]) / initW;
		const aV = (newC2[1] - newC0[1]) / initW;
		const bU = (newC6[0] - newC0[0]) / initH;
		const bV = (newC6[1] - newC0[1]) / initH;

		// Translation: t = newC0 - A * initC0
		const txLS = newC0[0] - aU * initC0[0] - bU * initC0[1];
		const tyLS = newC0[1] - aV * initC0[0] - bV * initC0[1];

		// Column-major 4×4 affine (scale + rotation + translation in LS)
		const mAffineLS = mat4.fromValues(
			aU,
			aV,
			0,
			0,
			bU,
			bV,
			0,
			0,
			0,
			0,
			1,
			0,
			txLS,
			tyLS,
			0,
			1,
		);

		// Plane LS ↔ WS matrices
		// Use the parentNode's current accumulated matrix (includes rotation +
		// translation on top of the initial plane→WS transform) together with
		// the inverse of the INITIAL plane→WS matrix so that scaling, rotation
		// and translation are all composed correctly.
		const mWStoLSInitial = mat4.invert(mat4.create(), this.#M_planeToWS);
		if (!mWStoLSInitial) return;

		// M_ws_relative = currentParentMatrix × M_affine_LS × inv(initialPlaneMatrix)
		const mWSRelative = mat4.multiply(
			mat4.create(),
			this.#dtParentTransformation.matrix,
			mat4.multiply(mat4.create(), mAffineLS, mWStoLSInitial),
		);

		// placeholderMatrix = M_ws_relative × translation(initialOffset)
		mat4.multiply(
			this.#currentTransformationMatrix,
			mWSRelative,
			mat4.fromTranslation(mat4.create(), this.initialOffset),
		);

		if (commit) {
			this.updateObjectMatrices();
		} else {
			this.updateObjects();
		}
	}

	private dispatchDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		if (ev.drawingToolsId === this.#rotationHandler?.drawingTools.uuid) {
			this.handleRotationDrag(ev, commit);
		} else if (
			ev.drawingToolsId === this.#scalingHandler?.drawingTools.uuid
		) {
			this.handleRectDrag(ev, commit);
		}
	}

	private handleRectDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		if (!this.#scalingHandler) return;

		// ev.points are already in parent-local space (DT handles WS→LS via parentNode).
		let adjusted: vec3[];
		if (ev.controlIndex !== undefined) {
			// EdgeControl (midpoint) drag: the DT has already moved the two corner
			// points; apply axis-lock and clamp/snap on the updated positions.
			adjusted = this.#scalingHandler.controlMoved(
				ev.controlIndex,
				ev.points!,
				this.#localPoints,
			);
		} else {
			const dtIndex = ev.index!;
			const ci =
				this.#scalingHandler.pointsMapping.dtToConceptual[dtIndex];
			adjusted = this.#scalingHandler.cornerPointMoved(
				ci,
				ev.points!,
				this.#localPoints,
			);
		}

		this.#scalingHandler.flushRectPoints(adjusted, !commit);
		if (this.#rotationHandler)
			this.#rotationHandler.recompute(adjusted, !commit);

		// Keep the latest valid points even during drag-move. This prevents
		// pointer-out cancellations from reverting to stale pre-drag points.
		this.#localPoints = adjusted;

		if (commit) {
			this.#translationHandler?.updatePlane(adjusted);
			this.#hasPendingTemporaryTransform = false;
		} else {
			this.#hasPendingTemporaryTransform = true;
		}

		this.calculateTransformationMatrix(adjusted, commit);
	}

	// Commits the accumulated rotation at `finalNext` radians: updates the
	// parent matrix, flushes canonical DT point positions, and resets drag state.
	// Called from both the unchanged-angle and changed-angle commit paths in
	// handleRotationDrag so the logic lives in exactly one place.
	private commitRotation(finalNext: number): void {
		this.#accumulatedRotation = finalNext;
		this.#rotationCenter = vec3.fromValues(
			(this.#localPoints[0][0] + this.#localPoints[4][0]) / 2,
			(this.#localPoints[0][1] + this.#localPoints[4][1]) / 2,
			0,
		);
		this.applyAccumulatedTransform(
			this.#accumulatedRotation,
			this.#committedTranslation,
		);
		this.#scalingHandler?.flushRectPoints(this.#localPoints, false);
		this.#rotationHandler!.recompute(this.#localPoints, false);
		this.#translationHandler?.updatePlane(this.#localPoints);
		this.#hasPendingTemporaryTransform = false;
		this.#dragStartLocalPoints = undefined;
		this.#dragStartHandle = undefined;
		this.calculateTransformationMatrix(this.#localPoints, true);
	}

	private handleRotationDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		if (!this.#rotationHandler) return;

		if (this.#dragStartLocalPoints === undefined) {
			this.#dragStartLocalPoints = this.#localPoints.map((p) =>
				vec3.clone(p),
			);
			this.#dragStartHandle = vec3.clone(
				this.#rotationHandler.handleLocalPoint,
			);
			this.#dragStartCumulative = this.#cumulativeRotation;
		}

		const {deltaAngle: rawDelta} = this.#rotationHandler.computeDrag(
			ev,
			this.#localPoints,
		);

		const rawNext = this.#cumulativeRotation + rawDelta;
		const snappedNext = this.#rotationHandler.snapCumulative(rawNext);
		const {min, max} = this.#rotationConfig!;
		const finalNext =
			min !== undefined && max !== undefined
				? Math.min(max, Math.max(min, snappedNext))
				: min !== undefined
					? Math.max(min, snappedNext)
					: max !== undefined
						? Math.min(max, snappedNext)
						: snappedNext;

		if (finalNext === this.#cumulativeRotation) {
			// Angle unchanged: only commit the parent matrix on DRAG_END so the
			// object does not reset (DRAG_END almost always hits this branch).
			if (commit) this.commitRotation(finalNext);
			return;
		}

		const absoluteDelta = finalNext - this.#dragStartCumulative;
		const {rotated, newHandle} = this.#rotationHandler.computeDragByAngle(
			this.#dragStartLocalPoints!,
			absoluteDelta,
			this.#dragStartHandle,
		);

		this.#cumulativeRotation = finalNext;

		if (commit) {
			// On commit: bake rotation into the parent matrix and flush canonical
			// (axis-aligned) DT positions — the parent matrix now carries the rotation.
			this.commitRotation(finalNext);
		} else {
			// On drag-move: temporarily move DT points so the viewport renders them
			// at the rotated positions without updating the parent matrix yet.
			this.#scalingHandler?.flushRectPoints(rotated, true);
			this.#rotationHandler.applyDrag(newHandle, true);
			this.#hasPendingTemporaryTransform = true;
			// Pass the temporarily rotated positions so mAffineLS encodes the
			// rotation (parent matrix hasn't been updated yet).
			this.calculateTransformationMatrix(rotated, false);
		}
	}

	private init() {
		const initialTransformationMatrix = this.initialize();
		mat4.copy(
			this.#currentTransformationMatrix,
			initialTransformationMatrix,
		);

		// Compute the initial plane→WS matrix and create the shared DT parent node.
		// All drawing-tool instances receive this node so their points are stored
		// in plane-local space; the node's transform carries WS positioning.
		const planeOrigin = vec3.scale(
			vec3.create(),
			this.#plane.normal,
			-this.#plane.constant,
		);
		mat4.set(
			this.#M_planeToWS,
			this.#plane.vector_u[0],
			this.#plane.vector_u[1],
			this.#plane.vector_u[2],
			0,
			this.#plane.vector_v[0],
			this.#plane.vector_v[1],
			this.#plane.vector_v[2],
			0,
			this.#plane.normal[0],
			this.#plane.normal[1],
			this.#plane.normal[2],
			0,
			planeOrigin[0],
			planeOrigin[1],
			planeOrigin[2],
			1,
		);
		mat4.copy(this.#dtParentTransformation.matrix, this.#M_planeToWS);
		this.#dtParentNode = new TreeNode("RectangleTransformDTParent");
		this.#dtParentNode.addTransformation(this.#dtParentTransformation);
		sceneTree.root.addChild(this.#dtParentNode);
		sceneTree.root.updateVersion(false, false);

		// create the shared BB from the nodes so that
		// we can create points around it
		const box = new Box();
		this.nodes.forEach((node) => box.union(node.boundingBox));

		// project the 8 corners of the bounding box onto the plane
		let projectedPoints: vec3[] = [];
		for (let i = 0; i < 8; i++) {
			const point = vec3.fromValues(
				box.min[0] + (i & 1) * (box.max[0] - box.min[0]),
				box.min[1] + ((i >> 1) & 1) * (box.max[1] - box.min[1]),
				box.min[2] + ((i >> 2) & 1) * (box.max[2] - box.min[2]),
			);
			projectedPoints.push(this.#plane.clampPoint(point));
		}

		for (let i = 0; i < projectedPoints.length; i++)
			projectedPoints[i] = this.#plane.convertFromWSToLS(
				projectedPoints[i],
			);

		const min = vec3.fromValues(
			Math.min(...projectedPoints.map((p) => p[0])),
			Math.min(...projectedPoints.map((p) => p[1])),
			0,
		);
		const max = vec3.fromValues(
			Math.max(...projectedPoints.map((p) => p[0])),
			Math.max(...projectedPoints.map((p) => p[1])),
			0,
		);

		// Build the full 8-point conceptual array (corners + mids)
		const initPoints: vec3[] = [
			vec3.fromValues(min[0], min[1], 0), // C0
			vec3.fromValues((min[0] + max[0]) / 2, min[1], 0), // M1
			vec3.fromValues(max[0], min[1], 0), // C2
			vec3.fromValues(max[0], (min[1] + max[1]) / 2, 0), // M3
			vec3.fromValues(max[0], max[1], 0), // C4
			vec3.fromValues((min[0] + max[0]) / 2, max[1], 0), // M5
			vec3.fromValues(min[0], max[1], 0), // C6
			vec3.fromValues(min[0], (min[1] + max[1]) / 2, 0), // M7
		];
		this.#initialLocalPoints = initPoints.map((p) => vec3.clone(p));
		this.#localPoints = initPoints.map((p) => vec3.clone(p));
		this.#rotationCenter = vec3.fromValues(
			(initPoints[0][0] + initPoints[4][0]) / 2,
			(initPoints[0][1] + initPoints[4][1]) / 2,
			0,
		);

		if (this.settings?.enableScaling ?? true) {
			this.#scalingHandler = new RectangleTransformScalingHandler(
				this.viewport,
				this.#dtParentNode,
				this.#plane,
				this.#localPoints,
				{
					corners: this.settings?.corners,
					midpoints: this.settings?.midpoints,
				},
				this.#scalingConfig,
			);

			const constrained = this.#scalingHandler.applyInitialConstraints(
				this.#localPoints,
			);
			this.#localPoints = constrained;
			this.#scalingHandler.flushRectPoints(this.#localPoints, false);

			// Keep the initial frame as the original geometry and commit the constrained
			// state immediately so min/max/step restrictions are active from creation.
			this.calculateTransformationMatrix(this.#localPoints, true);
		}

		if (this.settings?.enableRotation ?? true) {
			this.#rotationHandler = new RectangleTransformRotationHandler(
				this.viewport,
				this.#dtParentNode,
				this.#localPoints,
				this.#rotationConfig,
			);
		}

		if (this.settings?.enableTranslation ?? true) {
			const translationRestrictions: RestrictionProperties[] = [];
			for (const restrictionId in this.settings?.restrictions) {
				const restriction = this.settings?.restrictions[restrictionId];
				if (!restriction) continue;
				if (!restriction.id) restriction.id = restrictionId;
				translationRestrictions.push(restriction);
			}

			this.#translationHandler = new RectangleTransformTranslationHandler(
				this.viewport,
				translationRestrictions.length
					? translationRestrictions
					: undefined,
				this.#dtParentNode,
				this.#M_planeToWS,
				() => this.#localPoints,
				(newPoints) => {
					// Rotation stays in parent matrix; extract translation delta and
					// apply it on top of the accumulated committed translation.
					const deltaLS = vec3.subtract(
						vec3.create(),
						newPoints[0],
						this.#localPoints[0],
					);
					const runningTrans = vec3.add(
						vec3.create(),
						this.#committedTranslation,
						deltaLS,
					);
					// Update parent matrix with correct order:
					// applyAccumulatedTransform builds M_planeToWS * T * M_rot,
					// which means rotate-then-translate — the translation is in
					// the initial (unrotated) plane-LS frame → world-aligned.
					// Using tempPoints would build M_rot * T which rotates the
					// translation direction, making it follow the object orientation.
					this.applyAccumulatedTransform(
						this.#accumulatedRotation,
						runningTrans,
						false,
					);
					// Sync the parent ThreeJS matrix so the DT handles (whose
					// buffer positions are in parent-LS) appear at correct WS
					// positions without triggering a full scene-tree rebuild.
					this.viewport.updateNodeTransformation(this.#dtParentNode);
					// Flush canonical LS positions — the parent matrix carries
					// the translation, same pattern as committed rotation.
					this.#scalingHandler?.flushRectPoints(
						this.#localPoints,
						true,
					);
					this.#rotationHandler?.recompute(this.#localPoints, true);
					this.#hasPendingTemporaryTransform = true;
					this.calculateTransformationMatrix(
						this.#localPoints,
						false,
					);
				},
				(newPoints) => {
					const deltaLS = vec3.subtract(
						vec3.create(),
						newPoints[0],
						this.#localPoints[0],
					);
					vec3.add(
						this.#committedTranslation,
						this.#committedTranslation,
						deltaLS,
					);
					this.applyAccumulatedTransform(
						this.#accumulatedRotation,
						this.#committedTranslation,
					);
					this.#translationHandler?.updatePlane(this.#localPoints);
					this.calculateTransformationMatrix(this.#localPoints, true);
				},
			);
		}
	}

	/**
	 * Recompute and write the shared DT parentNode matrix from the given
	 * accumulated rotation (radians) and translation (plane-LS vector).
	 * The rotation is always applied around the current rectangle centre.
	 */
	private applyAccumulatedTransform(
		rotation: number,
		translation: vec3,
		emitUpdate: boolean = true,
	): void {
		// Use the stored rotation center (set at rotation commit time), NOT
		// the current #localPoints center. If scaling happens between a rotation
		// and a translation, #localPoints center shifts, but the rotation pivot
		// must stay fixed to avoid a sudden jump when translation drag fires.
		const center = vec3.clone(this.#rotationCenter);
		const negCenter = vec3.negate(vec3.create(), center);
		// M_rot = translate(center) * rotZ(rotation) * translate(-center)
		const M_rot = mat4.multiply(
			mat4.create(),
			mat4.fromTranslation(mat4.create(), center),
			mat4.multiply(
				mat4.create(),
				mat4.fromZRotation(mat4.create(), rotation),
				mat4.fromTranslation(mat4.create(), negCenter),
			),
		);
		const M_trans = mat4.fromTranslation(mat4.create(), translation);
		// accumulated = M_trans * M_rot  (translate after rotate, both in LS)
		const accumulated = mat4.multiply(mat4.create(), M_trans, M_rot);
		mat4.multiply(
			this.#dtParentTransformation.matrix,
			this.#M_planeToWS,
			accumulated,
		);
		if (emitUpdate) this.#dtParentNode.updateVersion();
	}
}
