import {addListener, type IViewportApi} from "@shapediver/viewer";
import {type IRay} from "@shapediver/viewer.features.interaction";
import {
	GeometryMathManager,
	type IRestrictionManager,
	RestrictionManager,
	type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	EVENTTYPE_DRAWING_TOOLS,
	type IEvent,
	SystemInfo} from "@shapediver/viewer.shared.services";
import {type DrawingToolsEventResponseMapping} from "../../../interfaces/events/EventResponseMapping";
import {DrawingToolsManager} from "../../DrawingToolsManager";
import {ControlsManager} from "../controls/ControlsManager";
import {DeletionInteractionHandler} from "./handlers/DeletionInteractionHandler";
import {InsertionInteractionHandler} from "./handlers/InsertionInteractionHandler";
import {MidPointInteractionHandler} from "./handlers/MidPointInteractionHandler";
import {InteractionManagerHelper} from "./helpers/InteractionManagerHelper";
import {type IStrategy} from "./interfaces/IStrategy";
import {DesktopStrategy} from "./strategies/DesktopStrategy";
import {MobileStrategy} from "./strategies/MobileStategy";

export class InteractionManager {
	// #region Properties (12)

	readonly #deletionInteractionHandler: DeletionInteractionHandler;
	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #insertionInteractionHandler: InsertionInteractionHandler;
	readonly #interactionManagerHelper: InteractionManagerHelper;
	readonly #midPointInteractionHandler: MidPointInteractionHandler;
	readonly #restrictionManager: IRestrictionManager;
	readonly #viewport: IViewportApi;

	#controlsManager?: ControlsManager;
	#strategy: IStrategy;

	// #endregion Properties (12)

	// #region Constructors (1)

	constructor(drawingToolsManager: DrawingToolsManager) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#viewport = drawingToolsManager.viewport;
		this.#geometryMathManager =
			this.#drawingToolsManager.geometryMathManager;

		const restrictionsArray: RestrictionProperties[] = [];
		for (const restrictionId in this.#drawingToolsManager.settings
			.restrictions) {
			const restriction =
				this.#drawingToolsManager.settings.restrictions[restrictionId];
			if (!restriction.id) restriction.id = restrictionId;
			restrictionsArray.push(restriction);
		}
		this.#restrictionManager = new RestrictionManager(
			this.#drawingToolsManager.viewport,
			this.#drawingToolsManager.parentNode,
			restrictionsArray,
			this.#drawingToolsManager.settings.visualization,
		);

		this.#deletionInteractionHandler = new DeletionInteractionHandler(
			this.#drawingToolsManager,
			this,
		);
		this.#insertionInteractionHandler = new InsertionInteractionHandler(
			this.#drawingToolsManager,
			this,
		);
		this.#midPointInteractionHandler = new MidPointInteractionHandler(
			this.#drawingToolsManager,
			this,
		);

		this.#interactionManagerHelper = new InteractionManagerHelper(
			this.#drawingToolsManager,
			this,
		);

		addListener(EVENTTYPE_DRAWING_TOOLS.ADDED, (e: IEvent) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.ADDED];
			if (
				event.drawingToolsId !== this.#drawingToolsManager.parentNode.id
			)
				return;
			if (event.index !== undefined) {
				this.addPoint(event.index);
			} else if (event.indices !== undefined) {
				event.indices.forEach((index) => this.addPoint(index));
			}
		});

		addListener(EVENTTYPE_DRAWING_TOOLS.REMOVED, (e: IEvent) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.REMOVED];
			if (
				event.drawingToolsId !== this.#drawingToolsManager.parentNode.id
			)
				return;

			if (event.index !== undefined) {
				this.addPoint(event.index);
			} else if (event.indices !== undefined) {
				event.indices.forEach((index) => this.addPoint(index));
			}
		});

		this.#strategy = SystemInfo.instance.isMobile
			? new MobileStrategy(this.#drawingToolsManager, this)
			: new DesktopStrategy(this.#drawingToolsManager, this);

		if (
			this.#drawingToolsManager.settings.controls &&
			this.#drawingToolsManager.settings.controls.length > 0
		) {
			this.#controlsManager = new ControlsManager(
				this.#drawingToolsManager,
			);
		}
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get deletionInteractionHandler(): DeletionInteractionHandler {
		return this.#deletionInteractionHandler;
	}

	public get insertionInteractionHandler(): InsertionInteractionHandler {
		return this.#insertionInteractionHandler;
	}

	public get midPointInteractionHandler(): MidPointInteractionHandler {
		return this.#midPointInteractionHandler;
	}

	public get restrictionManager(): IRestrictionManager {
		return this.#restrictionManager;
	}

	public get interactionManagerHelper(): InteractionManagerHelper {
		return this.#interactionManagerHelper;
	}

	public get controlsManager(): ControlsManager | undefined {
		return this.#controlsManager;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (10)

	public addPoint(insertionIndex: number): void {
		this.#interactionManagerHelper.addPoint(insertionIndex);
	}

	public close(): void {
		if (this.#strategy.cameraFreezeFlag)
			this.#viewport.removeFlag(this.#strategy.cameraFreezeFlag);

		// Use onOut() instead of hard-setting "default" so the static
		// cursor-priority sets in DesktopStrategy are cleaned up. This prevents
		// closing one drawing-tools instance from resetting the cursor while
		// another instance still has a point hovered or is dragging.
		this.#strategy.onOut();

		this.#interactionManagerHelper.close();
		this.#restrictionManager.close();
		this.#controlsManager?.close();
	}

	public deleteSelection(): void {
		this.#deletionInteractionHandler.deleteSelection(
			this.#interactionManagerHelper.selectedPointIndices,
		);
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		if (this.#drawingToolsManager.closed) return;

		this.#strategy.onDown(event, ray);
	}

	/**
	 * On mouse move, move the selected point if there is one
	 *
	 * @param event
	 * @param ray
	 */
	public onMove(event: PointerEvent, ray: IRay): void {
		if (this.#drawingToolsManager.closed) return;

		this.#strategy.onMove(event, ray);
	}

	/**
	 * On mouse up, check if a point is close to the ray and deselect it
	 */
	public onUp(event: PointerEvent): void {
		if (this.#drawingToolsManager.closed) return;

		this.#strategy.onUp(event);
	}

	/**
	 * On mouse out.
	 */
	public onOut(): void {
		if (this.#drawingToolsManager.closed) return;

		this.#strategy.onOut();
	}

	public removePoint(index: number): void {
		this.#interactionManagerHelper.removePoint(index);
	}

	public onKeyDown(): void {
		if (this.#drawingToolsManager.closed) return;
		this.#strategy.onKeyDown();
	}
}
