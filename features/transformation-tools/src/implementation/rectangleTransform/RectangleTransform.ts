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
	RectangleTransformSettingsOptional,
} from "../../interfaces/rectangleTransform/IRectangleTransform";
import {TransformationToolsManager} from "../TransformationToolsManager";
import {IRectangleTransformHandler} from "./IRectangleTransformHandler";
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

	#dragEndListener: string;
	#dragMoveListener: string;
	#hasPendingTemporaryTransform: boolean = false;
	#isDTDragging: boolean = false;
	#initialLocalPoints: vec3[] = [];
	#localPoints: vec3[] = [];
	#rotationHandler: RectangleTransformRotationHandler | undefined;
	#scalingHandler: RectangleTransformScalingHandler | undefined;
	#translationHandler: RectangleTransformTranslationHandler | undefined;

	// Typed as the common interface for coordinating all handlers uniformly.
	get #handlers(): (IRectangleTransformHandler | undefined)[] {
		return [
			this.#scalingHandler,
			this.#rotationHandler,
			this.#translationHandler,
		];
	}

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
					type: RESTRICTION_TYPE.PLANE,
					rotation: planeDefinition.rotation
						? {
								angle: planeDefinition.rotation.angle,
								axis: vec3.fromValues(
									planeDefinition.rotation.axis[0],
									planeDefinition.rotation.axis[1],
									planeDefinition.rotation.axis[2],
								),
							}
						: undefined,
					origin: planeDefinition.origin
						? vec3.fromValues(
								planeDefinition.origin[0],
								planeDefinition.origin[1],
								planeDefinition.origin[2],
							)
						: vec3.fromValues(0, 0, 0),

					vector_u: planeDefinition.vector_u
						? vec3.fromValues(
								planeDefinition.vector_u[0],
								planeDefinition.vector_u[1],
								planeDefinition.vector_u[2],
							)
						: vec3.fromValues(1, 0, 0),
					vector_v: planeDefinition.vector_v
						? vec3.fromValues(
								planeDefinition.vector_v[0],
								planeDefinition.vector_v[1],
								planeDefinition.vector_v[2],
							)
						: vec3.fromValues(0, 1, 0),
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

	private get committedTranslation(): vec3 {
		return this.#translationHandler?.committedTranslation ?? vec3.create();
	}

	protected get transformationToolsPlaceholderMatrix(): mat4 {
		return this.#currentTransformationMatrix;
	}

	protected closeLogic(): void {
		this.#eventEngine.removeListener(this.#dragMoveListener);
		this.#eventEngine.removeListener(this.#dragEndListener);

		for (const handler of this.#handlers) handler?.close();

		sceneTree.root.removeChild(this.#dtParentNode);
		sceneTree.root.updateVersion(false, false);
	}

	protected onPointerOutLogic(_event: PointerEvent): void {
		this.#rotationHandler?.clearDragState();

		if (!this.#hasPendingTemporaryTransform) return;

		// Commit any in-progress rotation to the parent matrix before flushing
		// canonical positions, otherwise calculateTransformationMatrix writes
		// identity and the object resets.
		this.#rotationHandler?.syncAccumulatedToCumulative();
		this.applyAccumulatedTransform(this.committedTranslation);
		for (const handler of this.#handlers)
			handler?.recompute(this.#localPoints, false);
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

	protected onPointerMoveLogic(_event: PointerEvent): void {
		// Refresh the translation cursor after all DT canvas listeners have run.
		// queueMicrotask defers until after the current pointermove event cycle
		// so DT hover state is current when we check it.
		if (!this.#translationHandler) return;
		const handler = this.#translationHandler;
		queueMicrotask(() => {
			const blocked =
				this.#isDTDragging ||
				(this.#scalingHandler?.drawingTools.isInteractionActive() ??
					false) ||
				(this.#rotationHandler?.drawingTools.isInteractionActive() ??
					false);
			handler.refreshCursor(blocked);
		});
	}

	private dispatchDrag(ev: IDrawingToolsEvent, commit: boolean): void {
		// Guard: do not process a DT drag while translation is in progress.
		if (this.#translationHandler?.isDragging) return;
		if (ev.drawingToolsId === this.#rotationHandler?.drawingTools.uuid) {
			this.#isDTDragging = !commit;
			this.#rotationHandler.processDrag(ev, this.#localPoints, commit);
		} else if (
			ev.drawingToolsId === this.#scalingHandler?.drawingTools.uuid
		) {
			this.#isDTDragging = !commit;
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

		this.#scalingHandler.recompute(adjusted, !commit);
		if (this.#rotationHandler)
			this.#rotationHandler.recompute(adjusted, !commit);

		// Keep the latest valid points even during drag-move. This prevents
		// pointer-out cancellations from reverting to stale pre-drag points.
		this.#localPoints = adjusted;

		if (commit) {
			this.#translationHandler?.recompute(adjusted, false);
			this.#hasPendingTemporaryTransform = false;
		} else {
			this.#hasPendingTemporaryTransform = true;
		}

		this.calculateTransformationMatrix(adjusted, commit);
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

		if (this.settings?.enableScaling ?? true) {
			this.#scalingHandler = new RectangleTransformScalingHandler(
				this.viewport,
				this.#dtParentNode,
				this.#localPoints,
				{
					corners: this.settings?.corners,
					midpoints: this.settings?.midpoints,
				},
				this.settings?.scaling,
			);

			this.#scalingHandler.recompute(this.#localPoints, false);

			// Read back the positions actually stored in the DT after applyConstraints
			// may have clamped the initial points (e.g. size min/max restrictions).
			// Without this sync #localPoints would still hold the unconstrained values
			// and calculateTransformationMatrix would not update the object.
			this.#localPoints =
				this.#scalingHandler.readbackConstrainedPoints();

			// Commit the constrained state so that the object reflects the DT
			// geometry from creation and min/max/step restrictions are active.
			this.calculateTransformationMatrix(this.#localPoints, true);
		}

		if (this.settings?.enableRotation ?? true) {
			this.#rotationHandler = new RectangleTransformRotationHandler(
				this.viewport,
				this.#dtParentNode,
				this.#localPoints,
				this.settings?.rotation,
				(rotated) => {
					// Drag-move: temporarily show rotated positions; parent matrix
					// is not yet updated so mAffineLS encodes the rotation.
					this.#scalingHandler?.recompute(rotated, true);
					this.#hasPendingTemporaryTransform = true;
					this.calculateTransformationMatrix(rotated, false);
				},
				(localPoints) => {
					// Drag-end: bake rotation into parent matrix and commit.
					this.applyAccumulatedTransform(this.committedTranslation);
					this.#scalingHandler?.recompute(localPoints, false);
					this.#translationHandler?.recompute(localPoints, false);
					this.#hasPendingTemporaryTransform = false;
					this.calculateTransformationMatrix(localPoints, true);
				},
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
				// Blocked when either DT has active hover/drag, OR a DT drag is still
				// flagged (covers the gap before isInteractionActive updates)
				() =>
					this.#isDTDragging ||
					(this.#scalingHandler?.drawingTools.isInteractionActive() ??
						false) ||
					(this.#rotationHandler?.drawingTools.isInteractionActive() ??
						false),
				() => {
					// Cancel any active DT drag so only translation runs for this gesture.
					this.#scalingHandler?.drawingTools.cancelDrag();
					this.#rotationHandler?.drawingTools.cancelDrag();
					this.#isDTDragging = false;
				},
				(runningTrans) => {
					// Rotation stays in parent matrix; translate on top of it.
					this.applyAccumulatedTransform(runningTrans, false);
					this.#scalingHandler?.recompute(this.#localPoints, true);
					this.#rotationHandler?.recompute(this.#localPoints, true);
					this.#hasPendingTemporaryTransform = true;
					this.calculateTransformationMatrix(
						this.#localPoints,
						false,
					);
				},
				(committedTrans) => {
					this.applyAccumulatedTransform(committedTrans);
					// Permanently commit the DT handle positions that were only
					// temporarily moved during drag-move, so the rotation/scaling
					// DT points reflect the current state when a new gesture starts.
					this.#scalingHandler?.recompute(this.#localPoints, false);
					this.#rotationHandler?.recompute(this.#localPoints, false);
					this.calculateTransformationMatrix(this.#localPoints, true);
				},
			);
		}
	}

	/**
	 * Recompute and write the shared DT parentNode matrix from the given
	 * translation (plane-LS vector). Rotation is taken from the rotation handler.
	 */
	private applyAccumulatedTransform(
		translation: vec3,
		emitUpdate: boolean = true,
	): void {
		// The accumulated rotation is stored as a matrix that was composed
		// incrementally across multiple gestures, so each rotation's center is
		// preserved correctly even when the rectangle center shifts due to
		// asymmetric scaling between rotations.
		const M_rot =
			this.#rotationHandler?.accumulatedRotationMatrix ?? mat4.create();
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
