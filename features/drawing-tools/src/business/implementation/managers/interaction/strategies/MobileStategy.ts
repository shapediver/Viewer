import {FLAG_TYPE, IRay} from "@shapediver/viewer.shared.types";

import {IViewportApi} from "@shapediver/viewer";
import {
	GeometryMathManager,
	IRestrictionManager,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
} from "@shapediver/viewer.shared.services";
import {vec3} from "gl-matrix";
import {MATERIAL_INDEX} from "../../../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {DeletionInteractionHandler} from "../handlers/DeletionInteractionHandler";
import {InteractionManagerHelper} from "../helpers/InteractionManagerHelper";
import {InteractionManager} from "../InteractionManager";
import {IStrategy} from "../interfaces/IStrategy";

export class MobileStrategy implements IStrategy {
	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #eventEngine = EventEngine.instance;
	readonly #deletionInteractionHandler: DeletionInteractionHandler;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #interactionManager: InteractionManager;
	readonly #interactionManagerHelper: InteractionManagerHelper;
	readonly #restrictionManager: IRestrictionManager;
	readonly #viewport: IViewportApi;

	readonly #longPressDelay: number = 500;

	#cameraFreezeFlag: string = "";
	#distances: {index: number; distance: number}[] | undefined;
	#downPress:
		| {
				event: PointerEvent;
				ray: IRay;
		  }
		| undefined;
	#downPressTimeout: NodeJS.Timeout | undefined;
	#hoveredPoint: number | undefined = undefined;

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
		this.#deletionInteractionHandler =
			this.#interactionManager.deletionInteractionHandler;
		this.#interactionManagerHelper =
			this.#interactionManager.interactionManagerHelper;
	}

	public get cameraFreezeFlag(): string {
		return this.#cameraFreezeFlag;
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		this.#downPress = {event, ray};

		// check if there are points close to the ray
		this.#distances = this.#geometryMathManager.checkPointDistances(
			this.#downPress!.ray,
			this.#drawingToolsManager.positionArray,
		);

		if (this.#distances && this.#distances.length > 0) {
			// select the point
			this.#interactionManagerHelper.toggleSelection(
				this.#distances[0].index,
			);

			this.#interactionManagerHelper.hoveredPoint =
				this.#distances[0].index;

			const draggingStarted =
				this.#interactionManagerHelper.startDragging();
			this.#interactionManagerHelper.moving = draggingStarted;

			// we remove this here, because on mobile there is actually no hovering
			this.#interactionManagerHelper.hoveredPoint = undefined;
			this.#hoveredPoint = this.#distances[0].index;

			if (draggingStarted && !this.#cameraFreezeFlag)
				this.#cameraFreezeFlag = this.#viewport.addFlag(
					FLAG_TYPE.CAMERA_FREEZE,
				);
		}

		this.#downPressTimeout = setTimeout(() => {
			// it's a long press!
			// do long press stuff here
			if (this.#distances && this.#distances.length > 0) {
				// remove the point
				this.#deletionInteractionHandler.deletePoint(ray);
			} else {
				// check if there is a midpoint close to the ray
				if (this.#drawingToolsManager.geometryState.canAddPoint()) {
					// check if there is a line close to the ray and add a mid point to it
					const lineDistances =
						this.#geometryMathManager.checkLineDistances(
							ray,
							this.#drawingToolsManager.positionArray,
							this.#drawingToolsManager.indicesArrayLines,
						);
					if (lineDistances) {
						let firstIndex = lineDistances[0].index[0];
						let secondIndex = lineDistances[0].index[1];

						const firstPoint =
							this.#drawingToolsManager.geometryState.getPosition(
								firstIndex,
							);
						const secondPoint =
							this.#drawingToolsManager.geometryState.getPosition(
								secondIndex,
							);
						const midPoint = vec3.add(
							vec3.create(),
							firstPoint,
							secondPoint,
						);
						vec3.scale(midPoint, midPoint, 0.5);

						this.#drawingToolsManager.addPoint(
							secondIndex,
							midPoint,
						);
					}
				}
			}

			// cleanup
			this.clearDownPress();
		}, this.#longPressDelay);
	}

	public onKeyDown(): void {}

	public onMove(event: PointerEvent, ray: IRay): void {
		const distanceSquared = this.#downPress
			? Math.pow(event.clientX - this.#downPress.event.clientX, 2) +
				Math.pow(event.clientY - this.#downPress.event.clientY, 2)
			: Infinity;
		const clickThresholdSquared = 25;
		const pointerMoved = distanceSquared > clickThresholdSquared;

		// if we have selected points, move them
		if (
			this.#interactionManagerHelper.selectedPointIndices.length > 0 &&
			pointerMoved === true
		) {
			this.#interactionManagerHelper.hoveredPoint = this.#hoveredPoint;

			// get the restricted point
			this.#interactionManagerHelper.moveSelectedPoints(ray);

			if (this.#downPressTimeout) {
				clearTimeout(this.#downPressTimeout);
				this.#downPressTimeout = undefined;
			}
		}
	}

	public onOut(): void {
		// cleanup
		this.#interactionManagerHelper.removeAllSelectedPoints();
		this.clearDownPress();
	}

	public onUp(): void {
		if (this.#downPressTimeout) {
			// it's a short press!
			// do short press stuff here

			// check if we pressed on an existing point
			if (this.#distances && this.#distances.length > 0) {
				const canBeClosed =
					this.#drawingToolsManager.settings.geometry.mode ===
						"lines" &&
					this.#drawingToolsManager.geometryState.getPointCount() >=
						3 &&
					this.#drawingToolsManager.geometryState.checkNumberOfPoints(
						this.#drawingToolsManager.geometryState.getPointCount(),
					);
				const shouldBeClosed =
					this.#drawingToolsManager.settings.geometry.close ===
						true &&
					this.#drawingToolsManager.geometryState.closeLoop ===
						false &&
					this.#drawingToolsManager.settings.geometry.autoClose ===
						false;

				// check if we pressed on the first point and if we can close the geometry
				if (
					this.#distances[0].index === 0 &&
					canBeClosed &&
					shouldBeClosed
				) {
					// close the geometry
					this.#drawingToolsManager.geometryState.closeLoop = true;

					this.#drawingToolsManager.updateMaterialIndex(
						0,
						MATERIAL_INDEX.DEFAULT,
					);

					this.#eventEngine.emitEvent(
						EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED,
						{
							viewportId: this.#drawingToolsManager.viewport.id,
							drawingToolId: this.#drawingToolsManager.uuid,
							points: this.#drawingToolsManager.geometryState.getPointsData(),
							metaData:
								this.#drawingToolsManager.geometryState
									.metadataArray,
							temporary: false,
							fromHistory: false,
						},
					);
				}
			} else {
				// get current ray
				const ray = this.#viewport.pointerEventToRay(
					this.#downPress!.event,
				);
				// add a point at the ray intersection
				const rayTraceResult = this.#restrictionManager.rayTrace(ray, {
					type: "drawing",
					positionArray: this.#drawingToolsManager.positionArray,
				});
				const restrictedPoint = rayTraceResult?.point;
				const insertionIndex =
					this.#drawingToolsManager.geometryState.getPointCount();
				this.#drawingToolsManager.addPoint(
					insertionIndex,
					restrictedPoint,
					rayTraceResult,
				);
			}
		} else {
			this.#interactionManagerHelper.hoveredPoint = undefined;
			this.#interactionManagerHelper.onUp();
		}

		// cleanup
		this.clearDownPress();
	}

	private clearDownPress(): void {
		if (this.#cameraFreezeFlag) {
			this.#viewport.removeFlag(this.#cameraFreezeFlag);
			this.#cameraFreezeFlag = "";
		}

		this.#hoveredPoint = undefined;
		this.#restrictionManager.showRestrictionVisualization = false;
		this.#interactionManagerHelper.reset();
		this.#distances = undefined;
		this.#downPress = undefined;
		if (this.#downPressTimeout) {
			clearTimeout(this.#downPressTimeout);
			this.#downPressTimeout = undefined;
		}
	}
}
