import {type IViewportApi, sceneTree, TreeNode} from "@shapediver/viewer";
import {
	DragManager,
	HoverManager,
	type IDragEvent,
	type IHoverEvent,
	InteractionData,
	InteractionEngine,
	type IRay,
	type PointerClaim} from "@shapediver/viewer.features.interaction";
import {
	type PlaneRestrictionProperties,
	type RestrictionProperties,
	RESTRICTION_TYPE} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	AttributeData,
	GeometryData,
	type ITreeNode,
	MaterialStandardData,
	PrimitiveData} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {MATERIAL_ALPHA, PRIMITIVE_MODE} from "@shapediver/viewer.shared.types";

import {mat4, vec3} from "gl-matrix";

import {type IRectangleTransformHandler} from "./IRectangleTransformHandler";

const PLANE_Z_OFFSET = 0.1;

// the distance (CSS px) from the pointerdown after which a press becomes a
// drag, see RectangleTransformTranslationOptions.translateOnObjects
const DRAG_THRESHOLD = 4;
const DRAG_THRESHOLD_TOUCH = 10;

export type RectangleTransformTranslationOptions = {
	/**
	 * A press on the transformed objects starts the translation too, and a
	 * press only becomes a drag once the pointer moved by the drag threshold.
	 */
	translateOnObjects?: boolean;
	/** Whether the rectangle transform is a preview. */
	isPreview?: () => boolean;
	/**
	 * Whether a rectangle transform of the viewport which is not a preview
	 * is under the pointer: a preview gives its plane to it.
	 */
	otherTransformHits?: (event: PointerEvent) => boolean;
	/**
	 * A translation ended without a change: a cancelled drag (see pause and
	 * InteractionEngine.onPointerCancel) or a press below the drag threshold.
	 */
	onCancel?: () => void;
};

export class RectangleTransformTranslationHandler
	implements IRectangleTransformHandler
{
	readonly #dragManager: DragManager;
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #hoverManager: HoverManager;
	readonly #interactionEngine: InteractionEngine;
	readonly #M_planeToWS: mat4;
	readonly #parentNode: ITreeNode;
	readonly #viewport: IViewportApi;

	#committedTranslation: vec3 = vec3.create();
	#dragEndToken: string = "";
	#dragMoveToken: string = "";
	#dragStartToken: string = "";
	#hoverOffToken: string = "";
	#hoverOnToken: string = "";
	#isDragging: boolean = false;
	#isHovering: boolean = false;
	#isInteractionBlocked: () => boolean;
	#onTranslationStart: () => void;
	#localPointsAtDragStart: vec3[] = [];
	#node!: ITreeNode;
	#previousNode: ITreeNode | undefined;
	#planeRestrictionToken: string | undefined;
	#removePointerDownClaim: (() => void) | undefined;
	#restrictions: RestrictionProperties[] | undefined;
	#restrictionTokens: string[] = [];
	readonly #transformedNodes: ITreeNode[];
	readonly #options: RectangleTransformTranslationOptions;
	// the pointerdown of the drag, undefined once it passed the drag threshold
	#dragStartPointer: {x: number; y: number; threshold: number} | undefined;

	constructor(
		viewport: IViewportApi,
		restrictions: RestrictionProperties[] | undefined,
		parentNode: ITreeNode,
		planeToWS: mat4,
		getLocalPoints: () => vec3[],
		occlusionExcludedNodes: ITreeNode[],
		isInteractionBlocked: () => boolean = () => false,
		onTranslationStart: () => void = () => {},
		onMove: (runningTrans: vec3) => void,
		onCommit: (committedTrans: vec3) => void,
		options: RectangleTransformTranslationOptions = {},
	) {
		this.#options = options;
		this.#M_planeToWS = planeToWS;
		this.#parentNode = parentNode;
		this.#viewport = viewport;
		this.#getLocalPoints = getLocalPoints;
		this.#isInteractionBlocked = isInteractionBlocked;
		this.#onTranslationStart = onTranslationStart;
		this.#onMove = onMove;
		this.#onCommit = onCommit;
		this.#transformedNodes = occlusionExcludedNodes;

		// Set up the interaction engine with a hover + plane-restricted drag manager
		this.#interactionEngine = new InteractionEngine(viewport);
		this.#hoverManager = new HoverManager();
		this.#dragManager = new DragManager();
		this.#dragManager.setOcclusionExcludedNodes(occlusionExcludedNodes);
		// The plane lies at the base of the object, which is usually in front
		// of it: only the plane itself is intersected, so the object (a
		// selectable node of another manager) does not block hover and drag.
		this.#hoverManager.restrictedNodesOnly = true;
		this.#dragManager.restrictedNodesOnly = true;
		this.#interactionEngine.addInteractionManager(this.#hoverManager);
		this.#interactionEngine.addInteractionManager(this.#dragManager);

		this.setRestrictions(restrictions);

		// Add the initial plane restriction from the parentNode's current world matrix.
		this.#planeRestrictionToken = this.#dragManager.addRestriction(
			this.currentPlaneRestriction(getLocalPoints()),
		);

		// Create the invisible draggable plane mesh covering the bounding rectangle
		this.createPlaneNode(getLocalPoints());

		// The plane lies on the object: a press on it would also reach the
		// selection managers of the object (and deselect it, which closes the
		// tool). The pointer is claimed for this handler's own engine while
		// the plane is dragged, or over the plane unless a closer object of
		// another engine wins.
		this.#removePointerDownClaim = InteractionEngine.addPointerDownClaim(
			viewport.id,
			(event, ray) => this.pointerClaim(event, ray),
			this.#interactionEngine,
		);
		this.#interactionEngine.pointerDownFilter = (event) =>
			this.pointerDownAllowed(event);

		// Snapshot local points at drag start so all DRAG_MOVE deltas are
		// computed relative to the committed state at the beginning of the drag
		this.#dragStartToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_START,
			(e) => {
				const ev = e as IDragEvent;
				if (ev.manager !== this.#dragManager) return;
				// Guard: do not start translation while a DT drag (scaling/rotation) is active.
				if (this.#isInteractionBlocked()) return;
				// Cancel any active DT hover/drag (e.g. a hovered edge control) so
				// that only translation runs for this gesture.
				this.#onTranslationStart();
				this.#localPointsAtDragStart = this.#getLocalPoints().map((p) =>
					vec3.clone(p),
				);
				this.#dragStartPointer =
					this.#options.translateOnObjects && ev.event
						? {
								x: ev.event.clientX,
								y: ev.event.clientY,
								threshold:
									ev.event.pointerType === "touch"
										? DRAG_THRESHOLD_TOUCH
										: DRAG_THRESHOLD,
							}
						: undefined;
				this.#isDragging = true;
				this.refreshCursor(false);
			},
		);

		this.#dragMoveToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_MOVE,
			(e) => {
				this.handleDrag(e as IDragEvent, false);
			},
		);

		this.#dragEndToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.DRAG_END,
			(e) => {
				const dragEv = e as IDragEvent;
				this.handleDrag(dragEv, true);
				if (dragEv.manager === this.#dragManager) {
					this.#isDragging = false;
					// recompute() replaced the node, so HOVER_OFF for the old
					// node won't fire. Reset hover state; the next pointermove
					// will fire HOVER_ON for the new node if pointer is inside.
					this.#isHovering = false;
					this.#viewport.canvas.style.cursor = "";
				}
			},
		);

		this.#hoverOnToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_ON,
			(e) => {
				const ev = e as IHoverEvent;
				const nodeMatch = ev.nodes.indexOf(this.#node) !== -1;
				const previousNodeMatch =
					!!this.#previousNode &&
					ev.nodes.indexOf(this.#previousNode) !== -1;
				if (ev.manager !== this.#hoverManager) return;
				if (!nodeMatch && !previousNodeMatch) return;
				// Stale intersection matched the previous node; clear it once accepted.
				if (previousNodeMatch) this.#previousNode = undefined;
				this.#isHovering = true;
				const blocked = this.#isInteractionBlocked();
				this.refreshCursor(blocked);
			},
		);

		this.#hoverOffToken = this.#eventEngine.addListener(
			EVENTTYPE.INTERACTION.HOVER_OFF,
			(e) => {
				const ev = e as IHoverEvent;
				const remainingHasNode = ev.nodes.indexOf(this.#node) !== -1;
				if (ev.manager !== this.#hoverManager) return;
				// The old (replaced) node was deactivated but our current node is
				// still in the remaining hover set — pointer hasn't left our mesh.
				if (remainingHasNode) return;
				this.#isHovering = false;
				if (!this.#isDragging) this.#viewport.canvas.style.cursor = "";
			},
		);
	}

	public get committedTranslation(): vec3 {
		return this.#committedTranslation;
	}

	public get isDragging(): boolean {
		return this.#isDragging;
	}

	public get restrictions(): RestrictionProperties[] | undefined {
		return this.#restrictions;
	}

	/**
	 * Refresh the canvas cursor based on current hover/drag state.
	 * @param blocked true if any DT point/control is currently hovered or being dragged
	 */
	public refreshCursor(blocked: boolean): void {
		const newCursor = this.#isDragging
			? "move"
			: this.#isHovering && !blocked
				? "move"
				: "";
		this.#viewport.canvas.style.cursor = newCursor;
	}

	/**
	 * Pause the translation: a drag in progress is cancelled (the rectangle
	 * returns to the committed translation), the plane is unhovered.
	 */
	public pause(): void {
		// cancelled right away (the rectangle transform pauses after the call
		// stack already): the cancelled DRAG_END returns to the committed
		// translation, also if the engine continues before its own cancel
		this.#dragManager.cancelInteraction();
		this.#hoverManager.cancelInteraction();
		this.#interactionEngine.pause();
		this.#isDragging = false;
		this.#isHovering = false;
		this.#viewport.canvas.style.cursor = "";
	}

	/**
	 * Resume the translation after {@link pause}.
	 */
	public continue(): void {
		this.#interactionEngine.continue();
	}

	public close(): void {
		this.#removePointerDownClaim?.();
		this.#removePointerDownClaim = undefined;
		this.#eventEngine.removeListener(this.#dragStartToken);
		this.#eventEngine.removeListener(this.#dragMoveToken);
		this.#eventEngine.removeListener(this.#dragEndToken);
		this.#eventEngine.removeListener(this.#hoverOnToken);
		this.#eventEngine.removeListener(this.#hoverOffToken);
		this.#viewport.canvas.style.cursor = "";
		this.#interactionEngine.close();
		sceneTree.root.removeChild(this.#node);
		sceneTree.root.updateVersion(false, false);
	}

	/**
	 * Rebuild the drag plane and restriction to match the current rectangle
	 * and parent-node world matrix (e.g. after a rotation commit).
	 */
	public recompute(localPoints: vec3[], _temporary: boolean): void {
		// Update the drag restriction to the current world-space plane.
		if (this.#planeRestrictionToken !== undefined) {
			this.#dragManager.removeRestriction(this.#planeRestrictionToken);
		}
		this.#planeRestrictionToken = this.#dragManager.addRestriction(
			this.currentPlaneRestriction(localPoints),
		);
		// Save the old node so HOVER_ON events carrying the stale node ID
		// (from the intersection cache) are still accepted after the swap.
		this.#previousNode = this.#node;
		sceneTree.root.removeChild(this.#node);
		this.createPlaneNode(localPoints);
	}

	/**
	 * The claim of the pointer (see InteractionEngine.addPointerDownClaim).
	 * Over the plane its distance is the closest hit of the plane or of the
	 * transformed objects: an object of this handler in front of its plane
	 * still belongs to it, an object of another tool in front of both wins.
	 */
	private pointerClaim(event: PointerEvent, ray: IRay): PointerClaim {
		if (this.#interactionEngine.paused) return false;
		if (this.#isDragging) return true;
		// a hovered or dragged handle claims the pointer itself
		if (this.#isInteractionBlocked()) return false;
		// a preview leaves the hover to the objects (e.g. its own object keeps
		// its hover effect)
		if (this.#options.isPreview?.() && event.type === "pointermove")
			return false;
		if (event.type === "pointerdown" && !this.pointerDownAllowed(event))
			return false;
		const planeDistance = this.planeDistance(ray);
		if (planeDistance === Infinity && !this.#options.translateOnObjects)
			return false;
		const distance = Math.min(planeDistance, this.objectDistance(ray));
		return distance === Infinity ? false : distance;
	}

	/**
	 * Whether a pointerdown may start the translation of a preview (and a
	 * pointermove may hover its plane): a rectangle transform under the
	 * pointer which is not a preview wins over the plane of the preview, its
	 * objects compete by distance.
	 */
	private pointerDownAllowed(event: PointerEvent): boolean {
		if (!this.#options.isPreview?.()) return true;
		if (!this.#options.otherTransformHits?.(event)) return true;
		return (
			!!this.#options.translateOnObjects &&
			this.objectDistance(this.#viewport.pointerEventToRay(event)) <
				Infinity
		);
	}

	private planeDistance(ray: IRay): number {
		return this.#interactionEngine.closestHitDistance(ray, [this.#node]);
	}

	/** The distance of the closest hit of the transformed objects. */
	public objectDistance(ray: IRay): number {
		return this.#interactionEngine.closestHitDistance(
			ray,
			this.#transformedNodes,
		);
	}

	/**
	 * Whether the plane or (with translateOnObjects) the transformed objects
	 * are under the pointer, regardless of the other tools.
	 */
	public hitsPointer(event: PointerEvent): boolean {
		if (this.#interactionEngine.paused) return false;
		const ray = this.#viewport.pointerEventToRay(event);
		if (this.planeDistance(ray) < Infinity) return true;
		return (
			!!this.#options.translateOnObjects &&
			this.objectDistance(ray) < Infinity
		);
	}

	/**
	 * What a pointerdown starts the translation on, undefined if it does not
	 * start the translation (e.g. another tool or a closer object wins it).
	 * A press on the plane is started by the drag manager, a press on the
	 * objects by {@link startDrag}.
	 */
	public pointerDownTarget(
		event: PointerEvent,
	): "plane" | "object" | undefined {
		if (!this.#interactionEngine.receivesPointerDown(event)) return;
		const ray = this.#viewport.pointerEventToRay(event);
		if (this.planeDistance(ray) < Infinity) return "plane";
		if (!this.#options.translateOnObjects) return;
		return this.objectDistance(ray) < Infinity ? "object" : undefined;
	}

	/**
	 * Start the translation for the gesture of a pointerdown on the objects
	 * (see {@link pointerDownTarget}), or for a gesture which started before
	 * this handler existed (`adopt`, e.g. the press which selected the object
	 * this rectangle transform was created for).
	 * @returns false if the translation did not start (e.g. the pointer was
	 * released already).
	 */
	public startDrag(event: PointerEvent, adopt: boolean): boolean {
		if (this.#interactionEngine.paused || this.#isDragging) return false;
		if (adopt && !this.#interactionEngine.continueGesture(event))
			return false;
		const ray = this.#viewport.pointerEventToRay(event);
		const restriction = this.currentPlaneRestriction(
			this.#getLocalPoints(),
		);
		const normal = vec3.normalize(
			vec3.create(),
			vec3.cross(
				vec3.create(),
				restriction.vector_u!,
				restriction.vector_v!,
			),
		);
		// the drag starts on the restriction plane, so the press does not move
		// anything by itself
		const denominator = vec3.dot(normal, ray.direction);
		let distance =
			Math.abs(denominator) > 1e-9
				? vec3.dot(
						vec3.subtract(
							vec3.create(),
							restriction.origin!,
							ray.origin,
						),
						normal,
					) / denominator
				: -1;
		if (!(distance >= 0)) distance = this.objectDistance(ray);
		if (distance === Infinity) return false;
		const point = vec3.scaleAndAdd(
			vec3.create(),
			ray.origin,
			ray.direction,
			distance,
		);
		this.#dragManager.setNode(
			this.#node,
			undefined,
			distance,
			point,
			event,
			ray,
		);
		return this.#isDragging;
	}

	/**
	 * Place the handler on other objects (see RectangleTransform.setNodes):
	 * the translation starts at zero, the restrictions are replaced.
	 */
	public reset(
		localPoints: vec3[],
		restrictions: RestrictionProperties[] | undefined,
	): void {
		vec3.set(this.#committedTranslation, 0, 0, 0);
		this.setRestrictions(restrictions);
		this.recompute(localPoints, false);
	}

	private setRestrictions(
		restrictions: RestrictionProperties[] | undefined,
	): void {
		this.#restrictionTokens.forEach((token) =>
			this.#dragManager.removeRestriction(token),
		);
		this.#restrictions = restrictions;
		// add all other restrictions (e.g. snapping) configured for this handler
		this.#restrictionTokens = (restrictions ?? [])
			.map((restriction) => this.#dragManager.addRestriction(restriction))
			.filter((token): token is string => token !== undefined);
	}

	/** Build a plane restriction from the parentNode's current world matrix. */
	private currentPlaneRestriction(
		localPoints: vec3[],
	): PlaneRestrictionProperties {
		const M = this.#parentNode.worldMatrix;
		const cx = (localPoints[0][0] + localPoints[4][0]) / 2;
		const cy = (localPoints[0][1] + localPoints[4][1]) / 2;
		// The drag starts at the intersection with the plane mesh, which is
		// offset along the normal; the restriction plane must share that
		// offset, otherwise a tilted camera yields a translation without
		// pointer movement.
		const normalWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[8], M[9], M[10]),
		);
		const origin = vec3.scaleAndAdd(
			vec3.create(),
			vec3.fromValues(
				M[0] * cx + M[4] * cy + M[12],
				M[1] * cx + M[5] * cy + M[13],
				M[2] * cx + M[6] * cy + M[14],
			),
			normalWS,
			PLANE_Z_OFFSET,
		);
		const vector_u = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[0], M[1], M[2]),
		);
		const vector_v = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[4], M[5], M[6]),
		);
		return {
			type: RESTRICTION_TYPE.PLANE,
			origin,
			vector_u,
			vector_v,
			createHelperObjects: false,
			// Below every authored snap. Equal priority keeps the closest hit,
			// and this face-on plane is always closer in an orthographic view.
			priority: Number.NEGATIVE_INFINITY,
		};
	}

	private createPlaneNode(localPoints: vec3[]) {
		const M = this.#parentNode.worldMatrix;
		// Normal direction = column 2 of the world matrix.
		const normalWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[8], M[9], M[10]),
		);
		const normalOffset = vec3.scale(
			vec3.create(),
			normalWS,
			PLANE_Z_OFFSET,
		);
		const positionArray = new Float32Array(12); // 4 vertices × 3 coords
		const cornerIndices = [0, 2, 4, 6];

		// Compute centroid of the 4 corner local points
		const centroid = vec3.create();
		for (const ci of cornerIndices)
			vec3.add(centroid, centroid, localPoints[ci]);
		vec3.scale(centroid, centroid, 1 / 4);

		const PLANE_SCALE = 0.925;
		for (let i = 0; i < 4; i++) {
			// Scale each corner toward the centroid so the plane is slightly
			// smaller than the bounding rectangle formed by the points
			const scaled = vec3.lerp(
				vec3.create(),
				centroid,
				localPoints[cornerIndices[i]],
				PLANE_SCALE,
			);
			// Transform LS corner to world space via parentNode matrix.
			const ws = vec3.add(
				vec3.create(),
				vec3.fromValues(
					M[0] * scaled[0] + M[4] * scaled[1] + M[12],
					M[1] * scaled[0] + M[5] * scaled[1] + M[13],
					M[2] * scaled[0] + M[6] * scaled[1] + M[14],
				),
				normalOffset,
			);
			positionArray[i * 3] = ws[0];
			positionArray[i * 3 + 1] = ws[1];
			positionArray[i * 3 + 2] = ws[2];
		}

		// Two triangles covering the quad: (0,1,2) and (0,2,3)
		const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

		const geometryData = new GeometryData(
			new PrimitiveData(
				{
					POSITION: new AttributeData(
						positionArray,
						3,
						12,
						0,
						4,
						false,
						positionArray.length,
					),
				},
				new AttributeData(indices, 1, 2, 0, 2, false, indices.length),
			),
			PRIMITIVE_MODE.TRIANGLES,
		);

		// Zero-opacity material – visually invisible but still ray-castable
		const material = new MaterialStandardData({
			opacity: 0,
			alphaMode: MATERIAL_ALPHA.BLEND,
			transparent: true,
			depthWrite: false,
			depthTest: false,
		});
		geometryData.castShadow = false;
		geometryData.receiveShadow = false;
		geometryData.material = material;

		const node = new TreeNode("RectangleTransformTranslationPlane");
		node.addData(geometryData);
		// Only the handler's own managers may hover or drag the plane. Other
		// managers would apply their effects to its zero-opacity material.
		const interactionData = new InteractionData(
			{drag: true, hover: true},
			undefined,
			[this.#hoverManager.id, this.#dragManager.id],
		);

		if (this.#restrictions && this.#restrictions.length > 0) {
			// use the plane centroid in world space
			// so the drag always starts from the centre of the rectangle.
			// centroid is already in current LS (localPoints are up-to-date),
			// so a plain LS→WS transform via the parent matrix is sufficient.
			interactionData.dragOrigin = vec3.add(
				vec3.create(),
				vec3.fromValues(
					M[0] * centroid[0] + M[4] * centroid[1] + M[12],
					M[1] * centroid[0] + M[5] * centroid[1] + M[13],
					M[2] * centroid[0] + M[6] * centroid[1] + M[14],
				),
				normalOffset,
			);
		}

		node.addData(interactionData);

		sceneTree.root.addChild(node);
		sceneTree.root.updateVersion(false, false);

		this.#node = node;
	}

	readonly #getLocalPoints: () => vec3[];

	private handleDrag(ev: IDragEvent, commit: boolean): void {
		if (ev.manager !== this.#dragManager) return;
		// Guard: skip if DT drag (scaling/rotation) is active, or if drag-start was suppressed.
		// Exception: always allow commit (DRAG_END) when isDragging — if we
		// were translating and got blocked mid-gesture (e.g. by a false-positive
		// rotation hover), we must still commit the accumulated delta so the
		// committedTranslation stays in sync with the visual state.
		if (!this.#isDragging) return;
		// A cancelled drag (see pause) returns to the committed translation.
		if (ev.cancelled) {
			this.#dragStartPointer = undefined;
			if (this.#options.onCancel) this.#options.onCancel();
			else this.#onMove(vec3.clone(this.#committedTranslation));
			this.#viewport.updateNodeTransformation(this.#parentNode);
			return;
		}
		if (this.#isInteractionBlocked() && !commit) {
			return;
		}
		// a press below the drag threshold does not move anything, its end
		// changes nothing
		const start = this.#dragStartPointer;
		if (start) {
			const moved =
				!!ev.event &&
				Math.hypot(
					ev.event.clientX - start.x,
					ev.event.clientY - start.y,
				) >= start.threshold;
			if (!moved) {
				if (!commit) return;
				this.#dragStartPointer = undefined;
				// the drag manager moved the plane node, it is rebuilt
				this.recompute(this.#getLocalPoints(), false);
				this.#options.onCancel?.();
				this.#viewport.updateNodeTransformation(this.#parentNode);
				return;
			}
			this.#dragStartPointer = undefined;
		}
		if (!ev.matrix || this.#localPointsAtDragStart.length === 0) return;
		// The drag matrix is a pure translation in world space
		// (plane restriction + identity world transform of the mesh node).
		const deltaWS = mat4.getTranslation(vec3.create(), ev.matrix);
		// Project the WS delta onto the INITIAL (unrotated) plane axes from
		// M_planeToWS so that the result is in the initial plane-LS frame.
		// Using parentNode.worldMatrix (rotated axes) would give wrong directions
		// once an accumulated rotation has been applied.
		const M = this.#M_planeToWS;
		const uWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[0], M[1], M[2]),
		);
		const vWS = vec3.normalize(
			vec3.create(),
			vec3.fromValues(M[4], M[5], M[6]),
		);
		const deltaLS = vec3.fromValues(
			vec3.dot(deltaWS, uWS),
			vec3.dot(deltaWS, vWS),
			0,
		);
		if (commit) {
			vec3.add(
				this.#committedTranslation,
				this.#committedTranslation,
				deltaLS,
			);
			this.recompute(this.#getLocalPoints(), false);
			this.#onCommit(this.#committedTranslation);
		} else {
			const runningTrans = vec3.add(
				vec3.create(),
				this.#committedTranslation,
				deltaLS,
			);
			// onMove updates the parent transformation matrix first, then sync
			// the parent ThreeJS matrix so the DT handles (whose buffer positions
			// are in parent-LS) appear at correct WS positions without triggering
			// a full scene-tree rebuild.
			this.#onMove(runningTrans);
			this.#viewport.updateNodeTransformation(this.#parentNode);
		}
	}

	readonly #onCommit: (committedTrans: vec3) => void;

	readonly #onMove: (runningTrans: vec3) => void;
}
