import {IRay} from "@shapediver/viewer.shared.types";

import {IViewportApi} from "@shapediver/viewer";
import {
	GeometryMathManager,
	IRestrictionManager,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {InsertionInteractionHandler} from "../handlers/InsertionInteractionHandler";
import {MidPointInteractionHandler} from "../handlers/MidPointInteractionHandler";
import {InteractionManagerHelper} from "../helpers/InteractionManagerHelper";
import {InteractionManager} from "../InteractionManager";
import {IStrategy} from "../interfaces/IStrategy";

export class MobileStrategy implements IStrategy {
	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #insertionInteractionHandler: InsertionInteractionHandler;
	readonly #interactionManager: InteractionManager;
	readonly #interactionManagerHelper: InteractionManagerHelper;
	readonly #midPointInteractionHandler: MidPointInteractionHandler;
	readonly #restrictionManager: IRestrictionManager;
	readonly #viewport: IViewportApi;

	#cameraFreezeFlag: string = "";
	#lastEvent?: PointerEvent;
	#onDownPointer?: PointerEvent;

	constructor(
		drawingToolsManager: DrawingToolsManager,
		interactionManager: InteractionManager,
	) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#interactionManager = interactionManager;
		this.#viewport = drawingToolsManager.viewport;
		this.#geometryMathManager =
			this.#drawingToolsManager.geometryMathManager;
		this.#restrictionManager = this.#interactionManager.restrictionManager;
		this.#insertionInteractionHandler =
			this.#interactionManager.insertionInteractionHandler;
		this.#midPointInteractionHandler =
			this.#interactionManager.midPointInteractionHandler;
		this.#interactionManagerHelper =
			this.#interactionManager.interactionManagerHelper;
	}

	public get cameraFreezeFlag(): string {
		throw new Error("Method not implemented.");
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		throw new Error("Method not implemented.");
	}

	public onKeyDown(): void {
		throw new Error("Method not implemented.");
	}

	public onMove(event: PointerEvent, ray: IRay): void {
		throw new Error("Method not implemented.");
	}

	public onOut(): void {
		throw new Error("Method not implemented.");
	}

	public onUp(): void {
		throw new Error("Method not implemented.");
	}
}
