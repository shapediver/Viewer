import {type IViewportApi, sceneTree} from "@shapediver/viewer";
import {
	IntersectionEngine,
	RaycasterParameters,
	SelectionBox} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {Box} from "@shapediver/viewer.shared.math";
import {
	GeometryData,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	ShapeDiverViewerInteractionError,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	FLAG_TYPE,
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IRay,
	type IRayTracingIntersection,
	type ISceneEvent,
	type IViewportEvent,
} from "@shapediver/viewer.shared.types";

import {
	type IInteractionEngine,
	INTERACTION_STATE,
	type PointerClaim} from "../interfaces/IInteractionEngine";
import {type IInteractionManager} from "../interfaces/IInteractionManager";
import {InteractionData} from "./InteractionData";
import {IntersectionManager} from "./IntersectionManager";
import {MultiSelectManager} from "./managers/MultiSelectManager";

// distances closer than this count as a tie
const EPSILON = 1e-4;

type PointerClaimEntry = {
	claim: (event: PointerEvent, ray: IRay) => PointerClaim;
	owner?: InteractionEngine;
};

/** The claims of one pointer event, shared by the engines of the viewport. */
type PointerClaimDecision = {
	// the owners of the claims which returned true
	unconditionalOwners: (InteractionEngine | undefined)[];
	// the owners of the claims which returned a distance
	distanceOwners: Set<InteractionEngine | undefined>;
	closestClaimDistance: number;
	// the closest distance claim, undefined if an engine without a distance
	// claim has a closer candidate
	winner?: PointerClaimEntry;
	// the closest candidate of each engine without a distance claim
	candidateDistances: Map<InteractionEngine, number>;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface IInteractionEngineProperties {
	/**
	 * Opacity at or below which scene geometry does not occlude interactions
	 * when occludeBySceneGeometry is enabled. (default: 0.01)
	 */
	intersectionOpacity: number;

	/**
	 * The percentage of the scene size for the intersection of lines. (default: 0.025 = 2.5%)
	 */
	lineIntersectionPercentage: number;

	/**
	 * Pause the interactions while the viewport is busy (e.g. a session
	 * computes), see {@link IInteractionEngine.pauseWhileBusy}. (default: false)
	 */
	pauseWhileBusy: boolean;

	/**
	 * The percentage of the scene size for the intersection of points. (default: 0.025 = 2.5%)
	 */
	pointIntersectionPercentage: number;
}

export class InteractionEngine implements IInteractionEngine {
	readonly #canvasEventListenerToken: string;
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #intersectionManager: IntersectionManager =
		IntersectionManager.instance;
	readonly #managers: {[key: string]: IInteractionManager} = {};
	readonly #rayCasterParams: RaycasterParameters = {
		Line: {threshold: 1},
		Line2: {threshold: 1},
		Points: {threshold: 1},
		Mesh: {},
		LOD: {},
		Sprite: {},
	};
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
	readonly #viewport: IViewportApi;

	/**
	 * Drawing-tool points and controls are screen-space sprites (`depthTest:
	 * false`). The mesh behind a sprite is often the closer ray hit, so
	 * selection would toggle that mesh off on the same click that should drag
	 * the handle. A claim that returns true consumes pointerdown for this
	 * viewport's interaction managers; the drawing tool still receives it.
	 * A claim that returns a distance only wins over farther candidates.
	 */
	static readonly #pointerDownClaims = new Map<
		string,
		Set<PointerClaimEntry>
	>();
	static readonly #engines = new Map<string, Set<InteractionEngine>>();
	static readonly #claimDecisions = new WeakMap<
		PointerEvent,
		PointerClaimDecision
	>();

	#boxSelectionActive: boolean = false;
	#cameraFreezeFlag?: string;
	#closed: boolean = false;
	// the effective pause: paused by pause(), or while busy (pauseWhileBusy)
	#paused: boolean = false;
	#pausedManually: boolean = false;
	#pauseWhileBusy: boolean = false;
	#busy: boolean = false;
	readonly #busyModeTokens: string[] = [];
	// the pressed pointers, and the ones whose gesture was interrupted by a
	// pause or started while paused: the end of such a gesture is ignored
	// (see updatePauseState)
	// A gesture may start outside of the canvas (e.g. a button which adds a
	// node and drags it with DragManager.setNode), so the pointers are
	// tracked on the window.
	readonly #pressedPointers = new Set<number>();
	readonly #onWindowPointerDown = (event: PointerEvent) =>
		this.#pressedPointers.add(event.pointerId);
	// released outside of the canvas (after the canvas listeners otherwise)
	readonly #onWindowPointerEnd = (event: PointerEvent) =>
		this.#pressedPointers.delete(event.pointerId);
	readonly #interruptedPointers = new Set<number>();
	// pointers which cannot hover whose interrupted gesture ended: the
	// following pointerout is ignored too
	readonly #outAfterUpPointers = new Set<number>();
	#pointerDownClaimed: boolean = false;
	#pointerDownFilter?: (event: PointerEvent) => boolean;
	// the intersections of the managers for the latest pointer event, shared
	// by the claim decision and the delivery to the managers
	#intersectionCache?: {
		event: PointerEvent;
		lists: {[key: string]: IIntersectionDefinition[]};
	};
	#intersectionOpacity: number = 0.01;
	#lineIntersectionPercentage: number = 0.025;
	#pointIntersectionPercentage: number = 0.025;
	#sceneBoundingBoxChangeToken: string = "";
	#sceneBoundingSphereRadius: number = 0;
	#selectionBox: SelectionBox;

	constructor(
		viewport: IViewportApi,
		props?: Partial<IInteractionEngineProperties>,
	) {
		this.#viewport = viewport;
		this.#canvasEventListenerToken =
			this.#viewport.addCanvasEventListener(this);
		this.#selectionBox = new SelectionBox(this.#viewport.canvas);
		let engines = InteractionEngine.#engines.get(this.#viewport.id);
		if (!engines) {
			engines = new Set();
			InteractionEngine.#engines.set(this.#viewport.id, engines);
		}
		engines.add(this);
		window.addEventListener("pointerdown", this.#onWindowPointerDown, true);
		window.addEventListener("pointerup", this.#onWindowPointerEnd);
		window.addEventListener("pointercancel", this.#onWindowPointerEnd);
		if (props) {
			if (props.intersectionOpacity !== undefined)
				this.#intersectionOpacity = props.intersectionOpacity;
			if (props.lineIntersectionPercentage !== undefined)
				this.#lineIntersectionPercentage =
					props.lineIntersectionPercentage;
			if (props.pointIntersectionPercentage !== undefined)
				this.#pointIntersectionPercentage =
					props.pointIntersectionPercentage;
		}

		// follow the busy mode of the viewport (see pauseWhileBusy)
		this.#busy = this.#viewport.isBusy;
		this.#busyModeTokens.push(
			this.#eventEngine.addListener(
				EVENTTYPE.VIEWPORT.BUSY_MODE_ON,
				(e) => this.onBusyModeChange(e as IViewportEvent, true),
			),
			this.#eventEngine.addListener(
				EVENTTYPE.VIEWPORT.BUSY_MODE_OFF,
				(e) => this.onBusyModeChange(e as IViewportEvent, false),
			),
		);
		if (props?.pauseWhileBusy !== undefined)
			this.pauseWhileBusy = props.pauseWhileBusy;

		/**
		 * When the scene bounding box changes, the intersection thresholds need to be updated.
		 * We do this by listening to the scene bounding box change event.
		 * In the beginning, we set the scene bounding sphere radius to the root bounding box.
		 * This is the initial value and will be updated when the scene bounding box changes.
		 * The intersection thresholds are then updated accordingly.
		 */
		this.#sceneBoundingSphereRadius =
			sceneTree.root.boundingBox.boundingSphere.radius;
		this.updateIntersectionThresholds();
		this.#sceneBoundingBoxChangeToken = this.#eventEngine.addListener(
			EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
			(e) => {
				const event = e as ISceneEvent;
				if (event.viewportId === this.#viewport.id) {
					const boundingBox = new Box(
						event.boundingBox!.min,
						event.boundingBox!.max,
					);
					this.#sceneBoundingSphereRadius =
						boundingBox.boundingSphere.radius;
					this.updateIntersectionThresholds();
				}
			},
		);
	}

	public get closed(): boolean {
		return this.#closed;
	}

	public get intersectionOpacity(): number {
		return this.#intersectionOpacity;
	}

	public set intersectionOpacity(value: number) {
		this.#intersectionOpacity = value;
	}

	public get lineIntersectionPercentage(): number {
		return this.#lineIntersectionPercentage;
	}

	public set lineIntersectionPercentage(value: number) {
		this.#lineIntersectionPercentage = value;
		this.updateIntersectionThresholds();
	}

	public get managers(): {[key: string]: IInteractionManager} {
		return this.#managers;
	}

	public get paused(): boolean {
		return this.#paused;
	}

	/**
	 * When set, a pointerdown for which it returns false does not reach the
	 * managers (nor the end of that gesture), and the engine has no candidate
	 * for it in the claim decision of the viewport (see
	 * {@link addPointerDownClaim}). A pointermove for which it returns false
	 * is no candidate either: a distance claim of another engine wins it.
	 */
	public get pointerDownFilter():
		| ((event: PointerEvent) => boolean)
		| undefined {
		return this.#pointerDownFilter;
	}

	public set pointerDownFilter(
		value: ((event: PointerEvent) => boolean) | undefined,
	) {
		this.#pointerDownFilter = value;
	}

	public get pauseWhileBusy(): boolean {
		return this.#pauseWhileBusy;
	}

	public set pauseWhileBusy(value: boolean) {
		this.#pauseWhileBusy = value;
		this.updatePauseState();
	}

	public get pointIntersectionPercentage(): number {
		return this.#pointIntersectionPercentage;
	}

	public set pointIntersectionPercentage(value: number) {
		this.#pointIntersectionPercentage = value;
		this.updateIntersectionThresholds();
	}

	public addInteractionManager(manager: IInteractionManager): string {
		if (this.#closed)
			throw new ShapeDiverViewerInteractionError(
				"The InteractionEngine has already been closed.",
			);
		const token = this.#uuidGenerator.create();
		this.#managers[token] = manager;
		manager.add(this.#viewport);
		return token;
	}

	public close(): void {
		if (this.#closed)
			throw new ShapeDiverViewerInteractionError(
				"The InteractionEngine has already been closed.",
			);
		this.#eventEngine.removeListener(this.#sceneBoundingBoxChangeToken);
		this.#busyModeTokens.forEach((token) =>
			this.#eventEngine.removeListener(token),
		);
		for (const m in this.#managers) this.removeInteractionManager(m);
		this.#viewport.removeCanvasEventListener(
			this.#canvasEventListenerToken,
		);
		window.removeEventListener(
			"pointerdown",
			this.#onWindowPointerDown,
			true,
		);
		window.removeEventListener("pointerup", this.#onWindowPointerEnd);
		window.removeEventListener("pointercancel", this.#onWindowPointerEnd);
		const engines = InteractionEngine.#engines.get(this.#viewport.id);
		engines?.delete(this);
		if (engines?.size === 0)
			InteractionEngine.#engines.delete(this.#viewport.id);
		this.#intersectionCache = undefined;
		this.#closed = true;
	}

	public pause(): void {
		if (this.#closed) return;
		this.#pausedManually = true;
		this.updatePauseState();
	}

	public continue(): void {
		if (this.#closed) return;
		this.#pausedManually = false;
		this.updatePauseState();
	}

	/** Follow the busy mode of the viewport (see {@link pauseWhileBusy}). */
	private onBusyModeChange(event: IViewportEvent, busy: boolean): void {
		if (event.viewportId !== this.#viewport.id) return;
		this.#busy = busy;
		this.updatePauseState();
	}

	/**
	 * Evaluate the effective pause (see {@link pause} and {@link pauseWhileBusy}).
	 * The events are ignored right away, the interactions in progress are
	 * cancelled after the current call stack: a pause from within the end of
	 * an interaction (e.g. a listener of its event computing a session) must
	 * not cancel the interaction which is being ended.
	 */
	private updatePauseState(): void {
		if (this.#closed) return;
		const paused =
			this.#pausedManually || (this.#pauseWhileBusy && this.#busy);
		if (paused === this.#paused) return;
		this.#paused = paused;
		if (!paused) return;

		queueMicrotask(() => {
			// a pause ended before (e.g. pause() and continue() in one call
			// stack) cancels nothing
			if (this.#closed || !this.#paused) return;
			// the end of a gesture interrupted by the pause must not reach the
			// managers (e.g. a selection on pointerup), also after a continue
			this.#pressedPointers.forEach((id) =>
				this.#interruptedPointers.add(id),
			);
			for (const m in this.#managers)
				this.#managers[m].cancelInteraction?.();
			// a box selection in progress ends without selecting
			if (this.#boxSelectionActive) {
				if (this.#cameraFreezeFlag)
					this.#viewport.removeFlag(this.#cameraFreezeFlag);
				this.#cameraFreezeFlag = undefined;
				this.#boxSelectionActive = false;
				this.#selectionBox.reset();
			}
			this.#viewport.render();
		});
	}

	public onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.#closed || this.#paused) return;
		for (const m in this.#managers)
			this.#managers[m].onKeyDown(event, pointerInCanvas);
	}

	public onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void {
		// a key released while paused must still reach the managers (e.g. the
		// modifier keys of the multi selection)
		if (this.#closed) return;
		for (const m in this.#managers)
			this.#managers[m].onKeyUp(event, pointerInCanvas);
	}

	public onMouseWheel(event: WheelEvent): void {
		if (this.#closed) return;
	}

	/**
	 * Register a pointer claim for one viewport. While the pointer is
	 * claimed, interaction managers on that viewport do not see the
	 * pointerdown (nor the end of that gesture), and see no intersections on
	 * pointermove (so nothing behind is hovered).
	 *
	 * `claim` returns a {@link PointerClaim}: `true` claims the pointer
	 * regardless of depth. Drawing tools use this so a handle drawn in screen
	 * space wins the pointer over a mesh in front of it. A distance claims the
	 * pointer only if no engine of the viewport has a closer candidate (e.g.
	 * the drag plane of a rectangle transform loses against an object in
	 * front of it); the closest distance claim wins over the others.
	 *
	 * A claim made for an `owner` engine does not apply to that engine: its
	 * own managers keep seeing the pointer, unless the claim loses against a
	 * closer candidate or against a claim of another owner.
	 */
	public static addPointerDownClaim(
		viewportId: string,
		claim: (event: PointerEvent, ray: IRay) => PointerClaim,
		owner?: InteractionEngine,
	): () => void {
		let claims = InteractionEngine.#pointerDownClaims.get(viewportId);
		if (!claims) {
			claims = new Set();
			InteractionEngine.#pointerDownClaims.set(viewportId, claims);
		}
		const entry = {claim, owner};
		claims.add(entry);
		return () => {
			claims.delete(entry);
			if (claims.size === 0)
				InteractionEngine.#pointerDownClaims.delete(viewportId);
		};
	}

	public onPointerDown(event: PointerEvent): void {
		if (this.#closed) return;
		this.#pressedPointers.add(event.pointerId);
		this.#outAfterUpPointers.delete(event.pointerId);
		// a gesture started while paused is ignored until its end
		if (this.#paused) {
			this.#interruptedPointers.add(event.pointerId);
			return;
		}
		this.#interruptedPointers.delete(event.pointerId);
		const ray = this.#viewport.pointerEventToRay(event);
		// a claimed pointerdown consumes the whole gesture: managers selecting
		// on pointerup must not see its end either
		this.#pointerDownClaimed =
			this.filtersPointer(event) ||
			this.isPointerClaimed(event, ray, INTERACTION_STATE.DOWN);
		if (this.#pointerDownClaimed) return;
		this.onDown(event, ray);
	}

	/**
	 * The browser cancelled the gesture (pointercancel): the interactions in
	 * progress are cancelled like on a pause (a drag returns its nodes to
	 * their placement before the drag), the end of the gesture and the
	 * following pointerout do not reach the managers.
	 */
	public onPointerCancel(event: PointerEvent): void {
		if (this.#closed) return;
		const pressed = this.#pressedPointers.has(event.pointerId);
		const interrupted = this.endGesture(event.pointerId);
		this.#pointerDownClaimed = false;
		this.#outAfterUpPointers.add(event.pointerId);
		if (this.#paused || interrupted || !pressed) return;
		for (const m in this.#managers) this.#managers[m].cancelInteraction?.();
		if (this.#boxSelectionActive) {
			if (this.#cameraFreezeFlag)
				this.#viewport.removeFlag(this.#cameraFreezeFlag);
			this.#cameraFreezeFlag = undefined;
			this.#boxSelectionActive = false;
			this.#selectionBox.reset();
		}
		this.#viewport.render();
	}

	public onPointerEnd(event: PointerEvent): void {
		if (this.#closed) return;
	}

	/**
	 * Whether the managers of this engine receive the pointerdown, i.e. it is
	 * not claimed by another engine or tool (see {@link addPointerDownClaim}).
	 * The decision is the one the engine applies to this event.
	 */
	public receivesPointerDown(event: PointerEvent): boolean {
		if (this.#closed || this.#paused) return false;
		if (this.filtersPointer(event)) return false;
		const ray = this.#viewport.pointerEventToRay(event);
		return !this.isPointerClaimed(event, ray, INTERACTION_STATE.DOWN);
	}

	/**
	 * Continue a gesture whose pointerdown this engine did not receive (e.g.
	 * the engine was created by that press): its moves and its end reach the
	 * managers, like for a gesture started on the canvas.
	 * @returns false if the pointer is not pressed anymore.
	 */
	public continueGesture(event: PointerEvent): boolean {
		if (this.#closed || this.#paused) return false;
		if (
			!InteractionEngine.isPointerPressed(
				this.#viewport.id,
				event.pointerId,
			)
		)
			return false;
		this.#pressedPointers.add(event.pointerId);
		this.#interruptedPointers.delete(event.pointerId);
		this.#outAfterUpPointers.delete(event.pointerId);
		this.#pointerDownClaimed = false;
		return true;
	}

	/**
	 * Whether the pointerdown filter rejects the event (a pointerdown or a
	 * pointermove), see {@link pointerDownFilter}.
	 */
	private filtersPointer(event: PointerEvent): boolean {
		return (
			(event.type === "pointerdown" || event.type === "pointermove") &&
			!!this.#pointerDownFilter &&
			!this.#pointerDownFilter(event)
		);
	}

	/**
	 * Whether an engine of the viewport tracks the pointer as pressed.
	 */
	public static isPointerPressed(
		viewportId: string,
		pointerId: number,
	): boolean {
		for (const engine of InteractionEngine.#engines.get(viewportId) ?? [])
			if (engine.#pressedPointers.has(pointerId)) return true;
		return false;
	}

	public onPointerMove(event: PointerEvent): void {
		if (this.#closed) return;
		// the button of an interrupted gesture was released outside of the
		// canvas (no pointerup): the gesture ended
		if (
			event.buttons === 0 &&
			this.#interruptedPointers.has(event.pointerId)
		) {
			this.endGesture(event.pointerId);
			this.#pointerDownClaimed = false;
		}
		// a hovering pointer (e.g. a pen) after an interrupted tap
		this.#outAfterUpPointers.delete(event.pointerId);
		if (this.#paused) return;
		const ray = this.#viewport.pointerEventToRay(event);
		if (this.isPointerClaimed(event, ray, INTERACTION_STATE.MOVE)) {
			for (const m in this.#managers)
				this.#managers[m].onMove(event, ray, []);
			return;
		}
		this.onMove(event, ray);
	}

	public onPointerOut(event: PointerEvent): void {
		if (this.#closed) return;
		// the pointerout following the pointerup of an interrupted gesture of
		// a pointer which cannot hover (e.g. touch) belongs to that gesture
		if (this.#outAfterUpPointers.delete(event.pointerId)) return;
		if (this.#paused) return;
		// the pointer of an interrupted gesture leaves: its end does not reach
		// the managers, a hover since the continue ends
		if (this.#interruptedPointers.has(event.pointerId)) {
			for (const m in this.#managers)
				this.#managers[m].cancelInteraction?.();
			return;
		}
		if (this.#pointerDownClaimed) {
			this.#pointerDownClaimed = false;
			return;
		}
		const ray = this.#viewport.pointerEventToRay(event);
		this.onEnd(event, ray, INTERACTION_STATE.OUT);
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.#closed) return;
		// the end of a gesture whose pointerdown was not received (it started
		// before the engine was created) does not reach the managers
		const pressed = this.#pressedPointers.has(event.pointerId);
		// the gesture ends, also while paused
		const interrupted = this.endGesture(event.pointerId);
		if (interrupted && event.pointerType === "touch")
			this.#outAfterUpPointers.add(event.pointerId);
		if (this.#paused || interrupted || !pressed) {
			this.#pointerDownClaimed = false;
			return;
		}
		if (this.#pointerDownClaimed) {
			this.#pointerDownClaimed = false;
			return;
		}
		const ray = this.#viewport.pointerEventToRay(event);
		this.onEnd(event, ray, INTERACTION_STATE.UP);
	}

	/**
	 * The gesture of a pointer ended.
	 * @returns whether it was interrupted by a pause (see updatePauseState).
	 */
	private endGesture(pointerId: number): boolean {
		this.#pressedPointers.delete(pointerId);
		return this.#interruptedPointers.delete(pointerId);
	}

	/**
	 * The distance of the closest hit of the ray with the geometry of the
	 * nodes, Infinity if none is hit. A claim can report it as its distance
	 * (see {@link addPointerDownClaim}).
	 */
	public closestHitDistance(
		ray: IRay,
		nodes: ITreeNode[],
		options?: {excludeInteractiveDescendants?: boolean},
	): number {
		// a child with its own interaction (text on a banner) is another
		// object. While it is measured, its meshes do not count as this node.
		const excluded = options?.excludeInteractiveDescendants
			? this.interactiveDescendantRoots(nodes)
			: [];
		const restore =
			excluded.length > 0 ? this.silenceRaycast(excluded) : undefined;
		try {
			let closest = Infinity;
			for (const node of nodes) {
				const geometryData: {[key: string]: GeometryData} = {};
				node.traverse((current) => {
					if (this.isExcluded(current, excluded)) return;
					for (const data of current.data)
						if (data instanceof GeometryData)
							geometryData[`${data.id}_${data.version}`] = data;
				});
				const hits = IntersectionEngine.instance.intersectNode(
					ray,
					node,
					geometryData,
					this.#viewport.id,
					undefined,
					this.#rayCasterParams,
				);
				if (hits && hits.length > 0)
					closest = Math.min(closest, hits[0].distance);
			}
			return closest;
		} finally {
			restore?.();
		}
	}

	/**
	 * Descendants that carry their own interaction data. Their geometry is
	 * another object, not the surface of the node a claim is measuring.
	 */
	private interactiveDescendantRoots(roots: ITreeNode[]): ITreeNode[] {
		const found: ITreeNode[] = [];
		const walk = (node: ITreeNode, isRoot: boolean) => {
			if (
				!isRoot &&
				node.data.some((data) => data instanceof InteractionData)
			) {
				found.push(node);
				return;
			}
			node.children.forEach((child) => walk(child, false));
		};
		roots.forEach((root) => walk(root, true));
		return found;
	}

	private isExcluded(node: ITreeNode, excluded: ITreeNode[]): boolean {
		let current: ITreeNode | undefined = node;
		while (current) {
			if (excluded.includes(current)) return true;
			current = current.parent;
		}
		return false;
	}

	/** Stop the raycaster on these nodes until the returned call. */
	private silenceRaycast(nodes: ITreeNode[]): () => void {
		type Raycastable = {raycast: () => void};
		const saved: {object: Raycastable; raycast: () => void}[] = [];
		for (const node of nodes) {
			node.traverse((current) => {
				const object = current.convertedObject[this.#viewport.id] as
					| Raycastable
					| undefined;
				if (!object?.raycast) return;
				saved.push({object, raycast: object.raycast});
				object.raycast = () => {};
			});
		}
		return () => {
			for (const entry of saved) entry.object.raycast = entry.raycast;
		};
	}

	private isPointerClaimed(
		event: PointerEvent,
		ray: IRay,
		state: INTERACTION_STATE,
	): boolean {
		const decision = this.pointerClaimDecision(event, ray, state);
		if (!decision) return false;
		const {unconditionalOwners, distanceOwners} = decision;
		if (unconditionalOwners.some((owner) => owner !== this)) return true;
		if (unconditionalOwners.includes(this)) return false;
		if (distanceOwners.has(this)) return decision.winner?.owner !== this;
		if (!decision.winner) return false;
		const distance = decision.candidateDistances.get(this) ?? Infinity;
		return decision.closestClaimDistance <= distance + EPSILON;
	}

	/**
	 * Evaluate the claims of the viewport once per pointer event, so that all
	 * engines of the viewport agree which one receives it.
	 */
	private pointerClaimDecision(
		event: PointerEvent,
		ray: IRay,
		state: INTERACTION_STATE,
	): PointerClaimDecision | undefined {
		const claims = InteractionEngine.#pointerDownClaims.get(
			this.#viewport.id,
		);
		if (!claims) return;
		const cached = InteractionEngine.#claimDecisions.get(event);
		if (cached) return cached;

		const decision: PointerClaimDecision = {
			unconditionalOwners: [],
			distanceOwners: new Set(),
			closestClaimDistance: Infinity,
			candidateDistances: new Map(),
		};
		for (const entry of claims) {
			const result = entry.claim(event, ray);
			if (result === true) {
				decision.unconditionalOwners.push(entry.owner);
			} else if (typeof result === "number") {
				decision.distanceOwners.add(entry.owner);
				// on a tie, the claim registered first wins
				if (result < decision.closestClaimDistance - EPSILON) {
					decision.closestClaimDistance = result;
					decision.winner = entry;
				}
			}
		}

		if (decision.winner && decision.unconditionalOwners.length === 0) {
			const engines =
				InteractionEngine.#engines.get(this.#viewport.id) ?? [];
			for (const engine of engines) {
				if (decision.distanceOwners.has(engine)) continue;
				const distance = engine.closestCandidateDistance(
					event,
					ray,
					state,
				);
				decision.candidateDistances.set(engine, distance);
				if (distance < decision.closestClaimDistance - EPSILON)
					decision.winner = undefined;
			}
		}

		InteractionEngine.#claimDecisions.set(event, decision);
		return decision;
	}

	/**
	 * The distance of the closest intersection which one of the managers
	 * would act on, Infinity if there is none.
	 */
	private closestCandidateDistance(
		event: PointerEvent,
		ray: IRay,
		state: INTERACTION_STATE,
	): number {
		if (this.#closed || this.#paused) return Infinity;
		if (this.filtersPointer(event)) return Infinity;
		// a box selection does not intersect along the ray
		const boxSelection =
			state === INTERACTION_STATE.DOWN
				? Object.values(this.#managers).some(
						(m) => m.boxSelectionActive,
					)
				: this.#boxSelectionActive;
		if (boxSelection) return Infinity;

		const lists = this.managerIntersections(ray, [state], event);
		let closest = Infinity;
		for (const m in this.#managers) {
			const filter = this.#managers[m].filter(state);
			const hit = lists[m].find(
				(i) => i.type === "RayTracingIntersection" && filter(i.node),
			) as IRayTracingIntersection | undefined;
			if (hit) closest = Math.min(closest, hit.distance);
		}
		return closest;
	}

	/**
	 * Intersect the scene with the filters of all managers for the given
	 * states, the result is the list of intersections per manager (without
	 * the ones occluded by scene geometry for managers using
	 * occludeBySceneGeometry).
	 *
	 * @param event cache the result for this pointer event
	 */
	private managerIntersections(
		ray: IRay,
		states: INTERACTION_STATE[],
		event?: PointerEvent,
		selectionBox?: SelectionBox,
	): {[key: string]: IIntersectionDefinition[]} {
		const cache = this.#intersectionCache;
		if (
			event &&
			!selectionBox &&
			cache?.event === event &&
			Object.keys(this.#managers).every((m) => cache.lists[m])
		)
			return cache.lists;

		const filters: IIntersectionFilter[] = [];
		for (const state of states)
			for (const m in this.#managers)
				filters.push(this.#managers[m].filter(state));

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBox,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		const needsOcclusion = Object.values(this.#managers).some(
			(m) => m.occludeBySceneGeometry,
		);
		const occluderDist = needsOcclusion
			? this.#intersectionManager.closestSceneGeometryDistance(
					ray,
					this.#viewport.id,
					this.#rayCasterParams,
					this.#intersectionOpacity,
				)
			: Infinity;
		const lists: {[key: string]: IIntersectionDefinition[]} = {};
		for (const m in this.#managers) {
			lists[m] =
				this.#managers[m].occludeBySceneGeometry &&
				occluderDist < Infinity
					? intersections.filter(
							(i) =>
								(i as IRayTracingIntersection).distance <=
								occluderDist + EPSILON,
						)
					: intersections;
		}

		if (event && !selectionBox) this.#intersectionCache = {event, lists};
		return lists;
	}

	public removeInteractionManager(token: string): boolean {
		if (this.#closed)
			throw new ShapeDiverViewerInteractionError(
				"The InteractionEngine has already been closed.",
			);
		if (!this.#managers[token]) return false;
		this.#managers[token].remove();
		delete this.#managers[token];
		return true;
	}

	/**
	 * Apply all filters for the intersection of the scene.
	 * Call all according interaction managers with the results.
	 *
	 * @param ray
	 */
	private onDown(event: PointerEvent, ray: IRay): void {
		// here we need to check if the box selection is active in any manager
		const boxSelectionActive = Object.values(this.#managers).some(
			(m) => m.boxSelectionActive,
		);
		this.#boxSelectionActive = boxSelectionActive;

		if (boxSelectionActive) {
			// camera freeze
			this.#cameraFreezeFlag = this.#viewport.addFlag(
				FLAG_TYPE.CAMERA_FREEZE,
			);
			this.#selectionBox.onDown(
				event,
				this.#viewport.camera!.project.bind(this.#viewport.camera!),
			);
		}

		const lists = this.managerIntersections(
			ray,
			[INTERACTION_STATE.DOWN],
			event,
			this.#boxSelectionActive ? this.#selectionBox : undefined,
		);
		for (const m in this.#managers)
			this.#managers[m].onDown(event, ray, lists[m]);
	}

	/**
	 * Apply all filters for the intersection of the scene.
	 * Call all according interaction managers with the results.
	 *
	 * @param ray
	 */
	private onEnd(
		event: PointerEvent,
		ray: IRay,
		endState: INTERACTION_STATE,
	): void {
		if (this.#boxSelectionActive) {
			this.#selectionBox.onEnd(event);
		}

		const lists = this.managerIntersections(
			ray,
			[endState, INTERACTION_STATE.END],
			undefined,
			this.#boxSelectionActive ? this.#selectionBox : undefined,
		);
		for (const m in this.#managers)
			this.#managers[m].onEnd(event, ray, lists[m], endState);

		if (this.#boxSelectionActive) {
			this.#viewport.removeFlag(this.#cameraFreezeFlag!);
			this.#cameraFreezeFlag = undefined;
			this.#boxSelectionActive = false;
			this.#selectionBox.reset();
		}
	}

	/**
	 * Apply all filters for the intersection of the scene.
	 * Call all according interaction managers with the results.
	 *
	 * @param ray
	 */
	private onMove(event: PointerEvent, ray: IRay): void {
		if (this.#boxSelectionActive) {
			// update box selection
			this.#selectionBox.onMove(
				event,
				Object.values(this.#managers).some(
					(m) => m instanceof MultiSelectManager && m.insertionActive,
				),
				Object.values(this.#managers).some(
					(m) => m instanceof MultiSelectManager && m.removalActive,
				),
			);
		}

		const lists = this.managerIntersections(
			ray,
			[INTERACTION_STATE.MOVE],
			event,
			this.#boxSelectionActive ? this.#selectionBox : undefined,
		);
		for (const m in this.#managers)
			this.#managers[m].onMove(event, ray, lists[m]);
	}

	private updateIntersectionThresholds(): void {
		this.#rayCasterParams.Points.threshold =
			this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
		this.#rayCasterParams.Line.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
		this.#rayCasterParams.Line2!.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
	}
}
