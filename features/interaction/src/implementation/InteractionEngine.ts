import {type IViewportApi, sceneTree} from "@shapediver/viewer";
import {
	RaycasterParameters,
	SelectionBox} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {Box} from "@shapediver/viewer.shared.math";
import {
	EventEngine,
	EVENTTYPE,
	ShapeDiverViewerInteractionError,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	FLAG_TYPE,
	type IIntersectionFilter,
	type IRay,
	type IRayTracingIntersection,
	type ISceneEvent,
	type IViewportEvent,
} from "@shapediver/viewer.shared.types";

import {
	type IInteractionEngine,
	INTERACTION_STATE} from "../interfaces/IInteractionEngine";
import {type IInteractionManager} from "../interfaces/IInteractionManager";
import {IntersectionManager} from "./IntersectionManager";
import {MultiSelectManager} from "./managers/MultiSelectManager";

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
	 */
	static readonly #pointerDownClaims = new Map<
		string,
		Set<{
			claim: (event: PointerEvent) => boolean;
			owner?: InteractionEngine;
		}>
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
	 * Register a pointer claim for one viewport. While `claim` returns true,
	 * interaction managers on that viewport do not see the pointerdown, and
	 * see no intersections on pointermove (so nothing behind is hovered).
	 * Drawing tools use this so a handle in front of a mesh wins the pointer.
	 * A claim made for an `owner` engine does not apply to that engine: its
	 * own managers keep seeing the pointer (e.g. the drag plane of the
	 * rectangle transform wins over the selection of the object behind it).
	 */
	public static addPointerDownClaim(
		viewportId: string,
		claim: (event: PointerEvent) => boolean,
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
		// a claimed pointerdown consumes the whole gesture: managers selecting
		// on pointerup must not see its end either
		this.#pointerDownClaimed = this.isPointerClaimed(event);
		if (this.#pointerDownClaimed) return;
		const ray = this.#viewport.pointerEventToRay(event);
		this.onDown(event, ray);
	}

	public onPointerEnd(event: PointerEvent): void {
		if (this.#closed) return;
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
		if (this.isPointerClaimed(event)) {
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

	private isPointerClaimed(event: PointerEvent): boolean {
		const claims = InteractionEngine.#pointerDownClaims.get(
			this.#viewport.id,
		);
		if (!claims) return false;
		for (const {claim, owner} of claims) {
			if (owner === this) continue;
			if (claim(event)) return true;
		}
		return false;
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
		const filters: IIntersectionFilter[] = [];
		for (const m in this.#managers)
			filters.push(this.#managers[m].filter(INTERACTION_STATE.DOWN));

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

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBox: this.#boxSelectionActive
						? this.#selectionBox
						: undefined,
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
		const EPSILON = 1e-4;
		for (const m in this.#managers) {
			const list =
				this.#managers[m].occludeBySceneGeometry &&
				occluderDist < Infinity
					? intersections.filter(
							(i) =>
								(i as IRayTracingIntersection).distance <=
								occluderDist + EPSILON,
						)
					: intersections;
			this.#managers[m].onDown(event, ray, list);
		}
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
		const filters: IIntersectionFilter[] = [];
		for (const m in this.#managers)
			filters.push(this.#managers[m].filter(endState));

		for (const m in this.#managers)
			filters.push(this.#managers[m].filter(INTERACTION_STATE.END));

		if (this.#boxSelectionActive) {
			this.#selectionBox.onEnd(event);
		}

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBox: this.#boxSelectionActive
						? this.#selectionBox
						: undefined,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		const needsOcclusionEnd = Object.values(this.#managers).some(
			(m) => m.occludeBySceneGeometry,
		);
		const occluderDistEnd = needsOcclusionEnd
			? this.#intersectionManager.closestSceneGeometryDistance(
					ray,
					this.#viewport.id,
					this.#rayCasterParams,
					this.#intersectionOpacity,
				)
			: Infinity;
		const EPSILON_END = 1e-4;
		for (const m in this.#managers) {
			const list =
				this.#managers[m].occludeBySceneGeometry &&
				occluderDistEnd < Infinity
					? intersections.filter(
							(i) =>
								(i as IRayTracingIntersection).distance <=
								occluderDistEnd + EPSILON_END,
						)
					: intersections;
			this.#managers[m].onEnd(event, ray, list, endState);
		}

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
		const filters: IIntersectionFilter[] = [];
		for (const m in this.#managers)
			filters.push(this.#managers[m].filter(INTERACTION_STATE.MOVE));

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

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBox: this.#boxSelectionActive
						? this.#selectionBox
						: undefined,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		const needsOcclusionMove = Object.values(this.#managers).some(
			(m) => m.occludeBySceneGeometry,
		);
		const occluderDistMove = needsOcclusionMove
			? this.#intersectionManager.closestSceneGeometryDistance(
					ray,
					this.#viewport.id,
					this.#rayCasterParams,
					this.#intersectionOpacity,
				)
			: Infinity;
		const EPSILON_MOVE = 1e-4;
		for (const m in this.#managers) {
			const list =
				this.#managers[m].occludeBySceneGeometry &&
				occluderDistMove < Infinity
					? intersections.filter(
							(i) =>
								(i as IRayTracingIntersection).distance <=
								occluderDistMove + EPSILON_MOVE,
						)
					: intersections;
			this.#managers[m].onMove(event, ray, list);
		}
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
