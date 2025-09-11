import {IViewportApi} from "@shapediver/viewer";
import {
	GeometryMathManager,
	IRestrictionManager,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {FLAG_TYPE, IRay} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {InsertionInteractionHandler} from "../handlers/InsertionInteractionHandler";
import {MidPointInteractionHandler} from "../handlers/MidPointInteractionHandler";
import {InteractionManagerHelper} from "../helpers/InteractionManagerHelper";
import {InteractionManager} from "../InteractionManager";
import {IStrategy} from "../interfaces/IStrategy";

export class DesktopStrategy implements IStrategy {
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
		return this.#cameraFreezeFlag;
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		if (event.button === 0) {
			this.#onDownPointer = event;
			this.#interactionManagerHelper.moving = false;

			/**
			 * IF INSERT KEY IS PRESSED
			 * FINALIZE INSERTION AND START A NEW ONE
			 */
			if (this.#insertionInteractionHandler.insertionActive === true) {
				const result =
					this.#insertionInteractionHandler.finalizeInsertion();
				const distances = this.#geometryMathManager.checkPointDistances(
					ray,
					this.#drawingToolsManager.positionArray,
				);
				this.#interactionManagerHelper.checkHover(distances, ray);
				if (result) {
					this.#drawingToolsManager.update();
					return;
				} else {
					this.#insertionInteractionHandler.startInsertion(event);
					return;
				}
			}
			const distances = this.#geometryMathManager.checkPointDistances(
				ray,
				this.#drawingToolsManager.positionArray,
			);

			/**
			 * IF MID POINT INSERTION IS ACTIVE
			 * FINISH MID POINT INSERTION IF THE CURRENT INDEX IS THE MID POINT INSERTION INDEX
			 */
			if (
				this.#midPointInteractionHandler.midPointInsertionActive ===
				true
			) {
				this.#midPointInteractionHandler.finishMidPointInsertion(
					distances,
				);
				this.#interactionManagerHelper.midPointInserted = true;
			}

			/**
			 * CHECK HOVERED POINT
			 */
			this.#interactionManagerHelper.checkHover(distances, ray);

			/**
			 * IF THERE IS A POINT CLOSE TO THE RAY
			 */
			this.#interactionManagerHelper.selectPoint(distances);

			/**
			 * IF THE CURRENTLY HOVERED POINT IS SELECTED
			 * START DRAGGING
			 */
			const draggingStarted =
				this.#interactionManagerHelper.startDragging();
			if (draggingStarted && !this.#cameraFreezeFlag)
				this.#cameraFreezeFlag = this.#viewport.addFlag(
					FLAG_TYPE.CAMERA_FREEZE,
				);
		} else if (event.button === 2) {
			/**
			 * WHEN RIGHT MOUSE BUTTON IS PRESSED
			 */
			this.onOut();
		}
	}

	/**
	 * On mouse move, move the selected point if there is one
	 *
	 * @param event
	 * @param ray
	 */
	public onMove(event: PointerEvent, ray: IRay): void {
		let currentRestrictedPoint: vec3 | undefined;

		// if there are no points, start with the insertion right away
		if (
			this.#drawingToolsManager.settings.general.autoStart &&
			this.#insertionInteractionHandler.insertionActive === false &&
			this.#drawingToolsManager.getPointsData().length === 0
		) {
			this.#lastEvent = event;
			currentRestrictedPoint =
				this.startInsertion() || currentRestrictedPoint;
		}

		// if the insertion was paused, try to start it again
		// it might not start if the ray is not intersecting with the restriction
		if (this.#insertionInteractionHandler.insertionPaused) {
			this.#lastEvent = event;
			currentRestrictedPoint =
				this.startInsertion() || currentRestrictedPoint;
		}

		const distanceSquared = this.#onDownPointer
			? Math.pow(event.clientX - this.#onDownPointer.clientX, 2) +
				Math.pow(event.clientY - this.#onDownPointer.clientY, 2)
			: Infinity;
		const clickThresholdSquared = 25;
		const pointerMoved = distanceSquared > clickThresholdSquared;

		this.#interactionManagerHelper.moving = pointerMoved;

		if (pointerMoved) {
			this.#lastEvent = event;
			/**
			 * IF WE ARE DRAGGING A POINT
			 * MOVE THE SELECTED POINTS
			 */
			currentRestrictedPoint =
				this.#interactionManagerHelper.moveSelectedPoints(ray) ||
				currentRestrictedPoint;
		}

		const distances = this.#geometryMathManager.checkPointDistances(
			ray,
			this.#drawingToolsManager.positionArray,
		);
		this.#interactionManagerHelper.checkHover(distances, ray);

		if (pointerMoved) {
			/**
			 * IF INSERT KEY IS PRESSED
			 * ADD POINT AT RAY INTERSECTION IF THERE IS NONE WAS ADDED
			 * MOVE LAST ADDED POINT IF THERE IS ONE
			 */
			currentRestrictedPoint =
				this.#insertionInteractionHandler.onMove(ray) ||
				currentRestrictedPoint;

			/**
			 * IF INSERT KEY IS NOT PRESSED AND DRAGGING IS NOT ACTIVE
			 * CHECK IF THERE IS A LINE CLOSE TO THE RAY AND ADD A MID POINT TO IT
			 */
			if (
				this.#insertionInteractionHandler.insertionActive === false &&
				this.#interactionManagerHelper.dragging === false &&
				this.#interactionManagerHelper.selectedPointIndices.length === 0
			) {
				this.#midPointInteractionHandler.onMove(
					ray,
					this.#interactionManagerHelper.hoveredPoint,
				);
			}
		}

		if (this.#interactionManagerHelper.dragging) {
			document.body.style.cursor = "grabbing";
		} else if (this.#interactionManagerHelper.hoveredPoint !== undefined) {
			document.body.style.cursor = "pointer";
		} else {
			document.body.style.cursor = "default";
		}

		// if the insertion is active, but the current point is not restricted, pause the insertion
		if (
			!currentRestrictedPoint &&
			this.#insertionInteractionHandler.insertionActive
		)
			this.#insertionInteractionHandler.pauseInsertion();

		this.#drawingToolsManager.textVisualizationManager.updatePointerPosition(
			currentRestrictedPoint,
		);
	}

	/**
	 * On mouse out, deselect the hovered point and remove the stop dragging
	 */
	public onOut(): void {
		this.#restrictionManager.showRestrictionVisualization = false;
		this.#insertionInteractionHandler.pauseInsertion();
		this.#interactionManagerHelper.onOut();
		this.reset();
	}

	public onUp(): void {
		this.#interactionManagerHelper.onUp();
		this.reset();
	}

	private reset(): void {
		if (this.#insertionInteractionHandler.insertionActive === false) {
			this.#restrictionManager.showRestrictionVisualization = false;
			this.#viewport.removeFlag(this.#cameraFreezeFlag);
			this.#cameraFreezeFlag = "";
		}
		this.#interactionManagerHelper.reset();
	}

	private startInsertion(): vec3 | undefined {
		this.#restrictionManager.showRestrictionVisualization = true;

		this.#midPointInteractionHandler.stopMidPointInsertion();

		return this.#insertionInteractionHandler.startInsertion(
			this.#lastEvent!,
		);
	}

	private stopInsertion(): void {
		this.#restrictionManager.showRestrictionVisualization = false;
		this.#insertionInteractionHandler.stopInsertion();
		this.#viewport.removeFlag(this.#cameraFreezeFlag);
		this.#cameraFreezeFlag = "";
	}

	public onKeyDown(): void {
		const insertKeyPressed = this.#drawingToolsManager.keyPressed(
			this.#drawingToolsManager.settings.controls.insert,
		);
		const cancelKeyPressed = this.#drawingToolsManager.keyPressed(
			this.#drawingToolsManager.settings.controls.cancel,
		);
		const confirmKeyPressed = this.#drawingToolsManager.keyPressed(
			this.#drawingToolsManager.settings.controls.confirm,
		);
		const deleteKeyPressed = this.#drawingToolsManager.keyPressed(
			this.#drawingToolsManager.settings.controls.delete,
		);

		/**
		 * IF CONFIRM KEY IS PRESSED
		 * - IF INSERTION IS ACTIVE, STOP INSERTION
		 * - IF INSERTION IS NOT ACTIVE, UPDATE DRAWING TOOL
		 */
		if (confirmKeyPressed) {
			if (
				this.#interactionManager.insertionInteractionHandler
					.insertionActive
			) {
				this.stopInsertion();
				this.#drawingToolsManager.update();
			} else {
				this.#drawingToolsManager.update();
			}
		}

		/**
		 * IF CANCEL KEY IS PRESSED
		 * - IF INSERTION IS ACTIVE, STOP INSERTION
		 * - IF INSERTION IS NOT ACTIVE, CANCEL DRAWING TOOL
		 */
		if (cancelKeyPressed) {
			if (
				this.#interactionManager.insertionInteractionHandler
					.insertionActive
			) {
				this.stopInsertion();
			} else {
				this.#drawingToolsManager.cancel();
			}
		}

		/**
		 * IF INSERT KEY IS PRESSED
		 * - START INSERTION
		 */
		if (insertKeyPressed) {
			this.startInsertion();
		}

		/**
		 * IF DELETE KEY IS PRESSED
		 * - DELETE SELECTION
		 */
		if (deleteKeyPressed) {
			this.#interactionManager.deleteSelection();
		}
	}
}
