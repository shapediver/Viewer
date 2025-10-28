import {IViewportApi, sceneTree} from "@shapediver/viewer";
import {RaycasterParameters} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {Box} from "@shapediver/viewer.shared.math";
import {
	EventEngine,
	EVENTTYPE,
	ShapeDiverViewerInteractionError,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	FLAG_TYPE,
	IIntersectionFilter,
	IRay,
	ISceneEvent,
} from "@shapediver/viewer.shared.types";
import {
	IInteractionEngine,
	INTERACTION_STATE,
} from "../interfaces/IInteractionEngine";
import {IInteractionManager} from "../interfaces/IInteractionManager";
import {IntersectionManager} from "./IntersectionManager";
import {MultiSelectManager} from "./managers/MultiSelectManager";

// #region Interfaces (1)

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface IInteractionEngineProperties {
	// #region Properties (3)

	/**
	 * The opacity from which the intersection is considered. (default: 0)
	 */
	intersectionOpacity: number;
	/**
	 * The percentage of the scene size for the intersection of lines. (default: 0.025 = 2.5%)
	 */
	lineIntersectionPercentage: number;
	/**
	 * The percentage of the scene size for the intersection of points. (default: 0.025 = 2.5%)
	 */
	pointIntersectionPercentage: number;

	// #endregion Properties (3)
}

// #endregion Interfaces (1)

// #region Classes (1)

export class InteractionEngine implements IInteractionEngine {
	// #region Properties (12)

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

	#closed: boolean = false;
	#intersectionOpacity: number = 0;
	#lineIntersectionPercentage: number = 0.025;
	#pointIntersectionPercentage: number = 0.025;
	#sceneBoundingSphereRadius: number = 0;
	#sceneBoundingBoxChangeToken: string = "";
	#boxSelectionActive: boolean = false;
	#cameraFreezeFlag?: string;
	#selectionBoxCoordinates?: {
		start: {x: number; y: number};
		end: {x: number; y: number};
	};
	#selectionBox?: HTMLDivElement;
	// #endregion Properties (12)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		props?: Partial<IInteractionEngineProperties>,
	) {
		this.#viewport = viewport;
		this.#canvasEventListenerToken =
			this.#viewport.addCanvasEventListener(this);
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

	// #endregion Constructors (1)

	// #region Public Getters And Setters (7)

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

	public get pointIntersectionPercentage(): number {
		return this.#pointIntersectionPercentage;
	}

	public set pointIntersectionPercentage(value: number) {
		this.#pointIntersectionPercentage = value;
		this.updateIntersectionThresholds();
	}

	// #endregion Public Getters And Setters (7)

	// #region Public Methods (11)

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
		for (const m in this.#managers) this.removeInteractionManager(m);
		this.#viewport.removeCanvasEventListener(
			this.#canvasEventListenerToken,
		);
		this.#closed = true;
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (this.#closed) return;
		for (const m in this.#managers) this.#managers[m].onKeyDown(event);
	}

	public onKeyUp(event: KeyboardEvent): void {
		if (this.#closed) return;
		for (const m in this.#managers) this.#managers[m].onKeyUp(event);
	}

	public onMouseWheel(event: WheelEvent): void {
		if (this.#closed) return;
	}

	public onPointerDown(event: PointerEvent): void {
		if (this.#closed) return;
		const ray = this.#viewport.pointerEventToRay(event);
		this.onDown(event, ray);
	}

	public onPointerEnd(event: PointerEvent): void {
		if (this.#closed) return;
	}

	public onPointerMove(event: PointerEvent): void {
		if (this.#closed) return;
		const ray = this.#viewport.pointerEventToRay(event);
		this.onMove(event, ray);
	}

	public onPointerOut(event: PointerEvent): void {
		if (this.#closed) return;
		const ray = this.#viewport.pointerEventToRay(event);
		this.onEnd(event, ray, INTERACTION_STATE.OUT);
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.#closed) return;
		const ray = this.#viewport.pointerEventToRay(event);
		this.onEnd(event, ray, INTERACTION_STATE.UP);
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

	// #endregion Public Methods (11)

	// #region Private Methods (4)

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
			const rect = this.#viewport.canvas.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
			this.#selectionBoxCoordinates = {
				start: {
					x: x,
					y: y,
				},
				end: {
					x: x,
					y: y,
				},
			};
		}

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBoxCoordinates: this.#boxSelectionActive
						? this.#selectionBoxCoordinates
						: undefined,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		for (const m in this.#managers)
			this.#managers[m].onDown(event, ray, intersections);
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
			const rect = this.#viewport.canvas.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			this.#selectionBoxCoordinates!.end = {
				x: x,
				y: y,
			};
		}

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBoxCoordinates: this.#boxSelectionActive
						? this.#selectionBoxCoordinates
						: undefined,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		for (const m in this.#managers)
			this.#managers[m].onEnd(event, ray, intersections, endState);

		if (this.#boxSelectionActive) {
			this.#viewport.removeFlag(this.#cameraFreezeFlag!);
			this.#cameraFreezeFlag = undefined;
			this.#selectionBox?.remove();
			this.#selectionBox = undefined;
			this.#boxSelectionActive = false;
			this.#selectionBoxCoordinates = undefined;
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
			const rect = this.#viewport.canvas.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
			this.#selectionBoxCoordinates!.end = {
				x: x,
				y: y,
			};
			this.updateSelectionBox();
		}

		const intersections =
			this.#intersectionManager.intersect(
				ray,
				this.#viewport.id,
				filters,
				{
					selectionBoxCoordinates: this.#boxSelectionActive
						? this.#selectionBoxCoordinates
						: undefined,
					rayCasterParams: this.#rayCasterParams,
				},
			) || [];

		for (const m in this.#managers)
			this.#managers[m].onMove(event, ray, intersections);
	}

	private updateIntersectionThresholds(): void {
		this.#rayCasterParams.Points.threshold =
			this.#sceneBoundingSphereRadius * this.#pointIntersectionPercentage;
		this.#rayCasterParams.Line.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
		this.#rayCasterParams.Line2!.threshold =
			this.#sceneBoundingSphereRadius * this.#lineIntersectionPercentage;
	}

	private updateSelectionBox(): void {
		if (!this.#selectionBoxCoordinates) return;

		const insertionActive = Object.values(this.#managers).some(
			(m) => m instanceof MultiSelectManager && m.insertionActive,
		);
		const removalActive = Object.values(this.#managers).some(
			(m) => m instanceof MultiSelectManager && m.removalActive,
		);

		let color = "0, 0, 255"; // blue
		if (insertionActive && !removalActive) {
			color = "0, 255, 0"; // green
		} else if (!insertionActive && removalActive) {
			color = "255, 0, 0"; // red
		}

		if (!this.#selectionBox) {
			// create selection box div
			this.#selectionBox = document.createElement("div");
			this.#selectionBox.style.position = "absolute";
			this.#selectionBox.style.border = `1px solid rgba(${color}, 0.8)`;
			this.#selectionBox.style.backgroundColor = `rgba(${color}, 0.1)`;
			this.#selectionBox.style.pointerEvents = "none";
			this.#viewport.canvas.parentElement?.appendChild(
				this.#selectionBox,
			);
		} else {
			// check if the color needs to be updated
			const currentBorderColor = this.#selectionBox.style.border;
			const desiredBorderColor = `1px solid rgba(${color}, 0.8)`;
			if (currentBorderColor !== desiredBorderColor) {
				this.#selectionBox.style.border = desiredBorderColor;
				this.#selectionBox.style.backgroundColor = `rgba(${color}, 0.1)`;
			}
		}

		const rect = this.#viewport.canvas.getBoundingClientRect();
		const convertedStartX =
			((this.#selectionBoxCoordinates.start.x + 1) / 2) * rect.width +
			rect.left;
		const convertedStartY =
			((1 - this.#selectionBoxCoordinates.start.y) / 2) * rect.height +
			rect.top;
		const convertedEndX =
			((this.#selectionBoxCoordinates.end.x + 1) / 2) * rect.width +
			rect.left;
		const convertedEndY =
			((1 - this.#selectionBoxCoordinates.end.y) / 2) * rect.height +
			rect.top;

		const x = Math.min(convertedStartX, convertedEndX);
		const y = Math.min(convertedStartY, convertedEndY);
		const width = Math.abs(convertedEndX - convertedStartX);
		const height = Math.abs(convertedEndY - convertedStartY);

		this.#selectionBox.style.left = `${x}px`;
		this.#selectionBox.style.top = `${y}px`;
		this.#selectionBox.style.width = `${width}px`;
		this.#selectionBox.style.height = `${height}px`;
	}

	// #endregion Private Methods (4)
}

// #endregion Classes (1)
