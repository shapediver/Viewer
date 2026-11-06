import {Box, type IViewportApi, sceneTree, TreeNode} from "@shapediver/viewer";
import {
	type IDrawingToolsEvent,
	type PlaneRestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.features.drawing-tools";
import {type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {Plane} from "@shapediver/viewer.shared.math";
import {
	GeometryData,
	type ITransformation,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	Logger,
} from "@shapediver/viewer.shared.services";

import {mat4, vec3} from "gl-matrix";

import {
	type IRectangleTransform,
	type RectangleTransformSettingsOptional,
} from "../../interfaces/rectangleTransform/IRectangleTransform";
import {
	type IRectangleTransformGestureEvent,
	type IRectangleTransformHoverEvent,
} from "../../interfaces/rectangleTransform/IRectangleTransformEvents";
import {TransformationToolsManager} from "../TransformationToolsManager";
import {type IRectangleTransformHandler} from "./IRectangleTransformHandler";
import {RectangleTransformRotationHandler} from "./RectangleTransformRotationHandler";
import {RectangleTransformScalingHandler} from "./RectangleTransformScalingHandler";
import {RectangleTransformTranslationHandler} from "./RectangleTransformTranslationHandler";

export class RectangleTransform
	extends TransformationToolsManager
	implements IRectangleTransform
{
	// the rectangle transforms of each viewport, a preview gives a press to
	// the others (see RectangleTransformSettings.preview)
	static readonly #instances: Map<string, Set<RectangleTransform>> =
		new Map();

	readonly #currentTransformationMatrix: mat4 = mat4.create();
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #plane: Plane;
	// the plane before it is aligned with the nodes, see setNodes
	readonly #basePlane: {constant: number; vector_u: vec3; vector_v: vec3};
	readonly #otherTransformHits: WeakMap<PointerEvent, boolean> =
		new WeakMap();
	#preview: boolean;
	#pointerOver: boolean = false;

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
	// Translation column = object's world-space pivot; orientation columns = vector_u/v/normal.
	#M_planeToWS: mat4 = mat4.create();
	// The initial world-space orientation+scale of the object (no translation).
	// = initialTransformationMatrix × translation(-initialOffset)
	// Used to rotate the interaction plane by the object's transform and to
	// transform local BB corners to world space.
	#M_initialWorldOrient: mat4 = mat4.create();
	// The starting placeholder matrix from initialize(). Stored so that
	// calculateTransformationMatrix can compose DT changes on top of it,
	// matching how the Gumball's placeholder starts at this matrix.
	#initialTransformationMatrix: mat4 = mat4.create();

	#dragEndListener: string;
	#dragMoveListener: string;
	#hasPendingTemporaryTransform: boolean = false;
	#isDTDragging: boolean = false;
	#initialLocalPoints: vec3[] = [];
	#localPoints: vec3[] = [];
	// The local points at the start of a DT drag (scaling/rotation), restored
	// when the drag is cancelled (see pauseLogic).
	#localPointsAtDTDragStart: vec3[] | undefined;
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
		id?: string,
	) {
		super(id, viewport, nodes, settings);

		// nodes with an empty bounding box are not in the viewport's scene yet
		const emptyNodes = nodes.filter((node) => node.boundingBox.isEmpty());
		if (emptyNodes.length > 0)
			Logger.instance.warn(
				`RectangleTransform: the bounding box of the node(s) ${emptyNodes.map((node) => node.name).join(", ")} is empty. The rectangle transform cannot be placed on them; create it once the nodes were added to the scene.`,
			);

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
		this.#basePlane = {
			constant: this.#plane.constant,
			vector_u: vec3.clone(this.#plane.vector_u),
			vector_v: vec3.clone(this.#plane.vector_v),
		};
		this.#preview = this.settings?.preview ?? false;

		let instances = RectangleTransform.#instances.get(viewport.id);
		if (!instances) {
			instances = new Set();
			RectangleTransform.#instances.set(viewport.id, instances);
		}
		instances.add(this);

		this.init();

		this.#dragMoveListener = this.#eventEngine.addListener(
			EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE,
			(e) => this.dispatchDrag(e as IDrawingToolsEvent, false),
		);
		this.#dragEndListener = this.#eventEngine.addListener(
			EVENTTYPE_DRAWING_TOOLS.DRAG_END,
			(e) => this.dispatchDrag(e as IDrawingToolsEvent, true),
		);

		this.viewport.render();
	}

	public get settings(): RectangleTransformSettingsOptional | undefined {
		return super.settings;
	}

	public get type(): "rectangleTransform" {
		return "rectangleTransform";
	}

	public get preview(): boolean {
		return this.#preview;
	}

	public containsPointer(event: PointerEvent): boolean {
		if (this.closed || !this.show) return false;
		if (this.handleHitsPointer(event)) return true;
		const ray = this.viewport.pointerEventToRay(event);
		if (
			(this.#translationHandler?.objectDistance(ray) ?? Infinity) <
			Infinity
		)
			return true;

		// the rectangle and the gap up to the rotation handle, in the space of
		// the drawing tools (the rectangle lies at z = 0)
		const toLS = mat4.invert(
			mat4.create(),
			this.#dtParentTransformation.matrix,
		);
		if (!toLS) return false;
		const origin = vec3.transformMat4(vec3.create(), ray.origin, toLS);
		const direction = vec3.sub(
			vec3.create(),
			vec3.transformMat4(
				vec3.create(),
				vec3.add(vec3.create(), ray.origin, ray.direction),
				toLS,
			),
			origin,
		);
		if (Math.abs(direction[2]) < 1e-12) return false;
		const t = -origin[2] / direction[2];
		if (t < 0) return false;
		const u = origin[0] + t * direction[0];
		const v = origin[1] + t * direction[1];
		const us = this.#localPoints.map((p) => p[0]);
		const vs = this.#localPoints.map((p) => p[1]);
		const minV = Math.min(...vs);
		const maxV = Math.max(...vs);
		const gap = this.#rotationHandler
			? (maxV - minV) * (this.settings?.rotation?.handleDistance ?? 0.25)
			: 0;
		return (
			u >= Math.min(...us) &&
			u <= Math.max(...us) &&
			v >= minV &&
			v <= maxV + gap
		);
	}

	public hitsPointer(event: PointerEvent): boolean {
		if (this.closed || this.paused || !this.show) return false;
		return (
			this.handleHitsPointer(event) ||
			(this.#translationHandler?.hitsPointer(event) ?? false)
		);
	}

	public promote(id: string): void {
		if (this.closed) return;
		this.changeId(id);
		this.#preview = false;
		this.#pointerOver = false;
		// like a gizmo created for the selection (see init)
		this.commitInitialPlacement();
	}

	public setNodes(
		nodes: ITreeNode[],
		restrictions?: Partial<{[key: string]: RestrictionProperties}>,
	): void {
		if (this.closed) return;
		this.cancelGesture();
		this.replaceNodes(nodes);
		this.#plane.constant = this.#basePlane.constant;
		this.#plane.vector_u = vec3.clone(this.#basePlane.vector_u);
		this.#plane.vector_v = vec3.clone(this.#basePlane.vector_v);
		this.#plane.normal = vec3.normalize(
			vec3.create(),
			vec3.cross(
				vec3.create(),
				this.#plane.vector_u,
				this.#plane.vector_v,
			),
		);
		const translationRestrictions = restrictions
			? this.translationRestrictions(restrictions)
			: undefined;

		this.placeOnNodes();
		this.#scalingHandler?.recompute(this.#localPoints, false);
		this.#localPoints =
			this.#scalingHandler?.readbackConstrainedPoints() ??
			this.#localPoints;
		this.#rotationHandler?.reset(this.#localPoints);
		if (this.#translationHandler)
			this.#translationHandler.reset(
				this.#localPoints,
				restrictions
					? translationRestrictions
					: this.#translationHandler.restrictions,
			);
		this.#dtParentNode.updateVersion();
		this.commitInitialPlacement();
		// cancelGesture paused the handlers
		if (!this.paused && this.show) this.continueHandlers();
		this.viewport.render();
	}

	public startTranslation(event: PointerEvent): boolean {
		if (this.closed || this.paused || !this.show) return false;
		return this.#translationHandler?.startDrag(event, true) ?? false;
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

		const instances = RectangleTransform.#instances.get(this.viewport.id);
		instances?.delete(this);
		if (instances?.size === 0)
			RectangleTransform.#instances.delete(this.viewport.id);
	}

	protected pauseLogic(): void {
		// Cancel a gesture in progress: the rectangle returns to its last
		// committed state. The temporary state is replaced without reporting a
		// matrix change (the committed state is the reported one).
		this.cancelGesture();
	}

	protected continueLogic(): void {
		if (!this.show) return;
		this.continueHandlers();
	}

	private continueHandlers(): void {
		this.#scalingHandler?.drawingTools.continue();
		this.#rotationHandler?.drawingTools.continue();
		this.#translationHandler?.continue();
	}

	protected showLogic(show: boolean): void {
		this.#pointerOver = show;
		if (show) {
			if (!this.paused) this.continueHandlers();
		} else {
			this.cancelGesture();
		}
		this.#dtParentNode.visible = show;
		this.#dtParentNode.updateVersion();
		sceneTree.root.updateVersion(false, false);
		this.viewport.render();
	}

	protected onPointerDownLogic(event: PointerEvent): void {
		if (!this.show) return;
		let target: "handle" | "plane" | "object" | undefined;
		if (
			this.handleHitsPointer(event) &&
			(!this.#preview || !this.otherTransformHitsPointer(event))
		)
			target = "handle";
		else target = this.#translationHandler?.pointerDownTarget(event);
		if (!target) return;

		const gestureEvent: IRectangleTransformGestureEvent = {
			viewportId: this.viewport.id,
			id: this.id,
			type: this.type,
			nodes: [...this.nodes],
			target: target === "handle" ? "handle" : "plane",
			event,
		};
		this.#eventEngine.emitEvent(
			EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START,
			gestureEvent,
		);
		// a listener may have closed or hidden this rectangle transform
		if (target === "object" && !this.closed && !this.paused && this.show)
			this.#translationHandler?.startDrag(event, false);
	}

	protected onPointerCancelLogic(): void {
		// the translation is cancelled by its interaction engine, a scaling or
		// rotation gesture returns to its start
		const rotationStart = this.#rotationHandler?.cancelGesture();
		if (!this.#isDTDragging && !rotationStart) return;
		if (this.#hasPendingTemporaryTransform) {
			if (rotationStart) this.#localPoints = rotationStart;
			else if (this.#localPointsAtDTDragStart)
				this.#localPoints = this.#localPointsAtDTDragStart;
		}
		this.#localPointsAtDTDragStart = undefined;
		this.#isDTDragging = false;
		// the drawing tools end the drag of a point when they are paused
		this.#scalingHandler?.drawingTools.pause();
		this.#rotationHandler?.drawingTools.pause();
		this.revertTemporaryTransform();
		this.continueDrawingTools();
		this.toggleCameraFreeze(false);
		this.viewport.render();
	}

	protected onPointerOutLogic(event: PointerEvent): void {
		if (this.#preview && this.#pointerOver && event.buttons === 0)
			this.setPointerOver(false);
		this.#rotationHandler?.clearDragState();
		// the drawing tools end a drag on a pointer out without a DRAG_END:
		// the gesture ends (it is committed below if it changed anything), a
		// pause must not restore its start
		this.#isDTDragging = false;
		this.#localPointsAtDTDragStart = undefined;

		if (!this.#hasPendingTemporaryTransform) return;

		// Commit any in-progress rotation to the parent matrix before flushing
		// canonical positions, otherwise calculateTransformationMatrix writes
		// identity and the object resets.
		this.#rotationHandler?.syncAccumulatedToCumulative();
		// Update the parent matrix without emitting yet, flush all DT handle
		// positions to canonical first, then emit — so the synchronous
		// updateCallback fired by updateVersion sees consistent state.
		this.applyAccumulatedTransform(this.committedTranslation, false);
		for (const handler of this.#handlers)
			handler?.recompute(this.#localPoints, false);
		this.#dtParentNode.updateVersion();
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

		const det = aU * bV - aV * bU;

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

		// Compute the world-space DT transform:
		// wsTransform = M_planeToWS × totalLS × inv(M_planeToWS)
		//             = dtParent × mAffineLS × inv(M_planeToWS)
		// This conjugation converts the plane-LS affine (scale + rotation +
		// translation from the DT handles) into a world-space transform that
		// correctly preserves the DT handle pivots.
		const mWStoLSInitial = mat4.invert(mat4.create(), this.#M_planeToWS);
		if (!mWStoLSInitial) return;

		const wsTransform = mat4.multiply(
			mat4.create(),
			this.#dtParentTransformation.matrix,
			mat4.multiply(mat4.create(), mAffineLS, mWStoLSInitial),
		);

		// Compose onto the initial placeholder matrix, matching the Gumball
		// pattern where the controls modify the placeholder starting state.
		// At rest (wsTransform = identity) this gives initialTransformationMatrix.
		mat4.multiply(
			this.#currentTransformationMatrix,
			wsTransform,
			this.#initialTransformationMatrix,
		);

		if (commit) {
			this.updateObjectMatrices();
		} else {
			this.updateObjects();
		}
	}

	private setPointerOver(over: boolean): void {
		this.#pointerOver = over;
		const hoverEvent: IRectangleTransformHoverEvent = {
			viewportId: this.viewport.id,
			id: this.id,
			type: this.type,
			nodes: [...this.nodes],
			hovered: over,
		};
		this.#eventEngine.emitEvent(
			EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED,
			hoverEvent,
		);
	}

	protected onPointerMoveLogic(event: PointerEvent): void {
		// a preview follows the pointer while no button is pressed (a drag,
		// also of the camera, does not change it)
		if (this.#preview && this.show && event.buttons === 0) {
			const over = this.containsPointer(event);
			if (over !== this.#pointerOver) this.setPointerOver(over);
		}
		// Refresh the translation cursor after all DT canvas listeners have run.
		// queueMicrotask defers until after the current pointermove event cycle
		// so DT hover state is current when we check it.
		if (!this.#translationHandler) return;
		const handler = this.#translationHandler;
		queueMicrotask(() => {
			// While translation is in progress, continuously cancel any hover
			// that the DT interaction strategies may have established during
			// this pointer-move cycle, so handles never appear highlighted.
			if (handler.isDragging) {
				this.#scalingHandler?.drawingTools.cancelDrag();
				this.#rotationHandler?.drawingTools.cancelDrag();
			}
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
		if (this.#translationHandler?.isDragging) {
			return;
		}
		if (!this.#isDTDragging && !commit)
			this.#localPointsAtDTDragStart = this.#localPoints.map((p) =>
				vec3.clone(p),
			);
		if (commit) this.#localPointsAtDTDragStart = undefined;
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

		// After a permanent commit, read back the positions actually stored in
		// the DT. applyConstraints inside movePoint may clamp corners (e.g.
		// uMin/uMax), so the DT state can differ from `adjusted`. Storing
		// unclamped `adjusted` in #localPoints would cause it to diverge from
		// the DT, leading to wrong positions when the next rotation commit
		// reuses #localPoints to reflush the scaling DT.
		if (commit) {
			const readback = this.#scalingHandler.readbackConstrainedPoints();
			this.#localPoints = readback;
		} else {
			this.#localPoints = adjusted;
		}

		if (this.#rotationHandler)
			this.#rotationHandler.recompute(this.#localPoints, !commit);

		if (commit) {
			this.#translationHandler?.recompute(this.#localPoints, false);
			this.#hasPendingTemporaryTransform = false;
		} else {
			this.#hasPendingTemporaryTransform = true;
		}

		this.calculateTransformationMatrix(this.#localPoints, commit);
	}

	private init() {
		this.placeOnNodes();
		this.#dtParentNode = new TreeNode("RectangleTransformDTParent");
		this.#dtParentNode.addTransformation(this.#dtParentTransformation);
		sceneTree.root.addChild(this.#dtParentNode);
		sceneTree.root.updateVersion(false, false);

		const scalingEnabled = this.settings?.enableScaling ?? true;
		const disabledCorners = {
			topLeft: false,
			topRight: false,
			bottomLeft: false,
			bottomRight: false,
		};
		this.#scalingHandler = new RectangleTransformScalingHandler(
			this.viewport,
			this.#dtParentNode,
			this.#localPoints,
			{
				corners: scalingEnabled
					? this.settings?.corners
					: disabledCorners,
				edgeControls: this.settings?.edgeControls,
				interactive: scalingEnabled,
			},
			this.settings?.scaling,
		);

		this.#scalingHandler.recompute(this.#localPoints, false);

		// Read back the positions actually stored in the DT after applyConstraints
		// may have clamped the initial points (e.g. size min/max restrictions).
		// Without this sync #localPoints would still hold the unconstrained values
		// and calculateTransformationMatrix would not update the object.
		this.#localPoints = this.#scalingHandler.readbackConstrainedPoints();

		this.commitInitialPlacement();

		this.createHandlers();
	}

	/**
	 * Commit the constrained state so that the object reflects the DT
	 * geometry from creation and min/max/step restrictions are active.
	 * A preview does not change its objects.
	 */
	private commitInitialPlacement(): void {
		if (this.#preview || !(this.settings?.enableScaling ?? true)) return;
		this.calculateTransformationMatrix(this.#localPoints, true);
	}

	/**
	 * Place the plane, its matrix and the rectangle on the nodes, see
	 * {@link init} and {@link setNodes}.
	 */
	private placeOnNodes() {
		const initialTransformationMatrix = this.initialize();
		mat4.copy(
			this.#currentTransformationMatrix,
			initialTransformationMatrix,
		);
		mat4.copy(
			this.#initialTransformationMatrix,
			initialTransformationMatrix,
		);
		this.captureInitialWorldMatrices();

		// Compute initial world orientation+scale (no geometry-center offset).
		// initialWorldOrient = initialTransformationMatrix × translation(-initialOffset)
		mat4.multiply(
			this.#M_initialWorldOrient,
			initialTransformationMatrix,
			mat4.fromTranslation(
				mat4.create(),
				vec3.negate(vec3.create(), this.initialOffset),
			),
		);

		// Rotate the interaction plane by the object's initial world orientation
		// so the DT handles and interaction plane are aligned with the object's
		// local axes. The plane definition's vector_u/v only provide the base
		// orientation; the object's transform applies on top.
		{
			const M = this.#M_initialWorldOrient;
			const rotateDir = (v: vec3): vec3 =>
				vec3.normalize(
					vec3.create(),
					vec3.fromValues(
						M[0] * v[0] + M[4] * v[1] + M[8] * v[2],
						M[1] * v[0] + M[5] * v[1] + M[9] * v[2],
						M[2] * v[0] + M[6] * v[1] + M[10] * v[2],
					),
				);
			this.#plane.vector_u = rotateDir(this.#plane.vector_u);
			this.#plane.vector_v = rotateDir(this.#plane.vector_v);
			this.#plane.normal = vec3.normalize(
				vec3.create(),
				vec3.cross(
					vec3.create(),
					this.#plane.vector_u,
					this.#plane.vector_v,
				),
			);
			// Place the plane through the geometry's world-space center
			// (not the node pivot) so the rectangle is centered on the object.
			const geometryCenterWS = vec3.transformMat4(
				vec3.create(),
				this.initialOffset,
				this.#M_initialWorldOrient,
			);
			this.#plane.constant = -vec3.dot(
				this.#plane.normal,
				geometryCenterWS,
			);
		}

		// Build M_planeToWS from the (now rotated) plane vectors.
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

		// Compute 8 world-space corners of the combined geometry extent,
		// then project them onto the interaction plane.
		let projectedPoints: vec3[] = [];
		if (this.singleNode) {
			// Single-node: use local GeometryData BBs + M_initialWorldOrient
			// for a tight rectangle aligned to the object's local axes.
			const localBB = new Box();
			this.nodes[0].traverseData((d) => {
				if (d instanceof GeometryData)
					localBB.union(this.geometryBoundingBox(d));
			});
			for (let i = 0; i < 8; i++) {
				const localPt = vec3.fromValues(
					localBB.min[0] +
						(i & 1) * (localBB.max[0] - localBB.min[0]),
					localBB.min[1] +
						((i >> 1) & 1) * (localBB.max[1] - localBB.min[1]),
					localBB.min[2] +
						((i >> 2) & 1) * (localBB.max[2] - localBB.min[2]),
				);
				const worldPt = vec3.transformMat4(
					vec3.create(),
					localPt,
					this.#M_initialWorldOrient,
				);
				projectedPoints.push(this.#plane.clampPoint(worldPt));
			}
		} else {
			// Multi-node: each node has its own world transform, so local
			// GeometryData BBs cannot be meaningfully unioned. Use the
			// world-space bounding boxes instead.
			const wsBB = new Box();
			this.nodes.forEach((node) => wsBB.union(node.boundingBox));
			for (let i = 0; i < 8; i++) {
				const wsPt = vec3.fromValues(
					wsBB.min[0] + (i & 1) * (wsBB.max[0] - wsBB.min[0]),
					wsBB.min[1] + ((i >> 1) & 1) * (wsBB.max[1] - wsBB.min[1]),
					wsBB.min[2] + ((i >> 2) & 1) * (wsBB.max[2] - wsBB.min[2]),
				);
				projectedPoints.push(this.#plane.clampPoint(wsPt));
			}
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

		// Clamp the initial bounding box up to uMin/vMin so the DT is never
		// created in a constraint-violating state
		// this can happen due to user error or floating point precision issues
		const scalingCfg = this.settings?.scaling;
		const SIZE_CONSTRAINT_EPSILON = 1e-5;
		if (scalingCfg?.uMin != null && max[0] - min[0] < scalingCfg.uMin) {
			const center = (min[0] + max[0]) / 2;
			const half = scalingCfg.uMin / 2 + SIZE_CONSTRAINT_EPSILON;
			min[0] = center - half;
			max[0] = center + half;
		}
		if (scalingCfg?.vMin != null && max[1] - min[1] < scalingCfg.vMin) {
			const center = (min[1] + max[1]) / 2;
			const half = scalingCfg.vMin / 2 + SIZE_CONSTRAINT_EPSILON;
			min[1] = center - half;
			max[1] = center + half;
		}

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
	}

	private translationRestrictions(
		restrictions: Partial<{[key: string]: RestrictionProperties}>,
	): RestrictionProperties[] | undefined {
		const translationRestrictions: RestrictionProperties[] = [];
		for (const restrictionId in restrictions) {
			const restriction = restrictions[restrictionId];
			if (!restriction) continue;
			if (!restriction.id) restriction.id = restrictionId;
			translationRestrictions.push(restriction);
		}
		return translationRestrictions.length
			? translationRestrictions
			: undefined;
	}

	private createHandlers() {
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
					// Update the parent matrix without emitting yet, flush all DT
					// handle positions to canonical first, then emit — so the
					// synchronous updateCallback fired by updateVersion sees
					// consistent state and not stale temporary-rotated positions.
					this.applyAccumulatedTransform(
						this.committedTranslation,
						false,
					);
					this.#scalingHandler?.recompute(localPoints, false);
					this.#translationHandler?.recompute(localPoints, false);
					this.#hasPendingTemporaryTransform = false;
					this.#dtParentNode.updateVersion();
					this.calculateTransformationMatrix(localPoints, true);
				},
			);
		}

		if (this.settings?.enableTranslation ?? true) {
			this.#translationHandler = new RectangleTransformTranslationHandler(
				this.viewport,
				this.translationRestrictions(this.settings?.restrictions ?? {}),
				this.#dtParentNode,
				this.#M_planeToWS,
				() => this.#localPoints,
				this.nodes,
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
					// Pause scaling/rotation drawing tools so their interaction
					// handlers ignore any pointer events during translation.
					this.#scalingHandler?.drawingTools.pause();
					this.#rotationHandler?.drawingTools.pause();
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
					// Resume scaling/rotation drawing tools now that translation is done.
					this.continueDrawingTools();
				},
				{
					translateOnObjects: this.settings?.translateOnObjects,
					isPreview: () => this.#preview,
					otherTransformHits: (event) =>
						this.otherTransformHitsPointer(event),
					onCancel: () => {
						this.revertTemporaryTransform();
						this.continueDrawingTools();
					},
				},
			);
		}

		// a preview gives a press to the rectangle transforms which are not
		// a preview, see RectangleTransformSettings.preview
		for (const handler of [this.#scalingHandler, this.#rotationHandler])
			if (handler)
				handler.drawingTools.pointerDownFilter = (event) =>
					!this.#preview || !this.otherTransformHitsPointer(event);
	}

	private continueDrawingTools(): void {
		if (this.paused || !this.show) return;
		this.#scalingHandler?.drawingTools.continue();
		this.#rotationHandler?.drawingTools.continue();
	}

	/**
	 * Return the rectangle and the objects to the committed state, without
	 * reporting a change (the committed state is the reported one).
	 */
	private revertTemporaryTransform(): void {
		if (!this.#hasPendingTemporaryTransform) return;
		this.applyAccumulatedTransform(this.committedTranslation, false);
		for (const handler of this.#handlers)
			handler?.recompute(this.#localPoints, false);
		this.#dtParentNode.updateVersion();
		this.calculateTransformationMatrix(this.#localPoints, false);
		this.#hasPendingTemporaryTransform = false;
	}

	/**
	 * Cancel a scaling or rotation gesture in progress, the rectangle
	 * returns to its last committed state. The drawing tools stay paused.
	 */
	private cancelGesture(): void {
		// (only a gesture which was not committed, e.g. by a pointer out, has
		// a temporary transformation)
		const rotationStart = this.#rotationHandler?.cancelGesture();
		if (this.#hasPendingTemporaryTransform) {
			if (rotationStart) this.#localPoints = rotationStart;
			else if (this.#isDTDragging && this.#localPointsAtDTDragStart)
				this.#localPoints = this.#localPointsAtDTDragStart;
		}
		this.#localPointsAtDTDragStart = undefined;
		this.#isDTDragging = false;
		// the drawing tools reset a point drag in progress, the translation
		// returns to the committed translation
		this.#scalingHandler?.drawingTools.pause();
		this.#rotationHandler?.drawingTools.pause();
		this.#translationHandler?.pause();
		this.revertTemporaryTransform();
	}

	/**
	 * Whether a rectangle transform of the viewport which is not a preview
	 * is under the pointer (computed once per event).
	 */
	private otherTransformHitsPointer(event: PointerEvent): boolean {
		const cached = this.#otherTransformHits.get(event);
		if (cached !== undefined) return cached;
		let hits = false;
		for (const other of RectangleTransform.#instances.get(
			this.viewport.id,
		) ?? []) {
			if (other === this || other.#preview) continue;
			if (other.hitsPointer(event)) {
				hits = true;
				break;
			}
		}
		this.#otherTransformHits.set(event, hits);
		return hits;
	}

	private handleHitsPointer(event: PointerEvent): boolean {
		return (
			(this.#scalingHandler?.drawingTools.hitsPointer(event) ?? false) ||
			(this.#rotationHandler?.drawingTools.hitsPointer(event) ?? false)
		);
	}

	/**
	 * Recompute and write the shared DT parentNode matrix from the given
	 * translation (plane-LS vector). Rotation is taken from the rotation handler.
	 */
	private applyAccumulatedTransform(
		translation: vec3,
		emitUpdate: boolean = true,
	): void {
		const M_rot =
			this.#rotationHandler?.accumulatedRotationMatrix ?? mat4.create();
		const M_trans = mat4.fromTranslation(mat4.create(), translation);
		const accumulated = mat4.multiply(mat4.create(), M_trans, M_rot);
		mat4.multiply(
			this.#dtParentTransformation.matrix,
			this.#M_planeToWS,
			accumulated,
		);
		if (emitUpdate) this.#dtParentNode.updateVersion();
	}
}
