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
	// Maps uuid → {distance, cancel} for any DT that has started a control drag
	// on the current touch. A later DT compares its own closest distance; if it
	// is closer it cancels the earlier claim and takes over, so the globally
	// nearest target always wins.
	static readonly #blockingInstances: Map<
		string,
		{distance: number; cancel: () => void}
	> = new Map();

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
		// Compute this DT's closest candidate distance (control or regular point)
		// so we can compete fairly against other DTs registered earlier.
		const controlsManager = this.#interactionManager.controlsManager;
		const controlDist =
			controlsManager?.closestControlDistance(ray) ?? Infinity;
		const pointDists = this.#geometryMathManager.checkPointDistances(
			ray,
			this.#drawingToolsManager.positionArray,
		);
		const pointDist = pointDists?.[0]?.distance ?? Infinity;
		const myClosestDist = Math.min(controlDist, pointDist);

		// Cross-DT priority: compete against any earlier DT that has registered a
		// control-drag claim.  If we are closer we cancel their weaker claim; if
		// they are closer (or equal) we are outbid and skip this DT entirely.
		// When this DT has nothing close (myClosestDist = Infinity) but another DT
		// does, skip to avoid spurious long-press at the same location.
		if (myClosestDist < Infinity) {
			const toCancel: Array<() => void> = [];
			let wasOutbid = false;
			for (const entry of MobileStrategy.#blockingInstances.values()) {
				if (myClosestDist < entry.distance) {
					toCancel.push(entry.cancel);
				} else {
					wasOutbid = true;
				}
			}
			if (wasOutbid) return;
			for (const cancel of toCancel) cancel();
		} else if (MobileStrategy.#blockingInstances.size > 0) {
			// Nothing close on this DT but another DT has a valid hit — skip.
			return;
		}

		this.#downPress = {event, ray};

		// Try edge-control drag first, but only if the control is at least as
		// close as this DT's own regular points.
		if (
			controlDist < Infinity &&
			controlDist <= pointDist &&
			controlsManager!.checkHover(ray) &&
			controlsManager!.startDragging()
		) {
			const uuid = this.#drawingToolsManager.uuid;
			MobileStrategy.#blockingInstances.set(uuid, {
				distance: controlDist,
				cancel: () => {
					this.#interactionManager.controlsManager?.onOut();
					this.clearDownPress();
				},
			});
			if (!this.#cameraFreezeFlag)
				this.#cameraFreezeFlag = this.#viewport.addFlag(
					FLAG_TYPE.CAMERA_FREEZE,
				);
			return;
		}

		// Reuse the already-computed point distances.
		this.#distances = pointDists;

		if (this.#distances && this.#distances.length > 0) {
			// Register this point hit as a blocking claim so that other DTs
			// processed later in the same touch event are outbid when their
			// nearest candidate is farther away.
			const uuid = this.#drawingToolsManager.uuid;
			MobileStrategy.#blockingInstances.set(uuid, {
				distance: pointDist,
				cancel: () => {
					this.#interactionManagerHelper.removeAllSelectedPoints();
					this.clearDownPress();
				},
			});

			// select the point
			if (this.#drawingToolsManager.settings.general.enableSelection)
				this.#interactionManagerHelper.toggleSelection(
					this.#distances[0].index,
				);

			this.#interactionManagerHelper.hoveredPoint =
				this.#distances[0].index;

			const draggingStarted =
				this.#drawingToolsManager.settings.general.enableTranslation &&
				this.#interactionManagerHelper.startDragging();
			this.#interactionManagerHelper.moving = !!draggingStarted;

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
				if (this.#drawingToolsManager.settings.general.enableDeletion)
					this.#deletionInteractionHandler.deletePoint(ray);
			} else {
				// check if there is a midpoint close to the ray
				if (
					this.#drawingToolsManager.settings.general
						.enableInsertion &&
					this.#drawingToolsManager.geometryState.canAddPoint()
				) {
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

		// If an edge control is being dragged, move it.
		const controlsManager = this.#interactionManager.controlsManager;
		if (controlsManager?.isDraggingControl) {
			if (pointerMoved) {
				controlsManager.moveDraggedControl(ray);
				if (this.#downPressTimeout) {
					clearTimeout(this.#downPressTimeout);
					this.#downPressTimeout = undefined;
				}
			}
			return;
		}

		// if we have selected points, move them
		if (
			this.#drawingToolsManager.settings.general.enableTranslation &&
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
		// Cancel any in-progress edge control drag.
		this.#interactionManager.controlsManager?.onOut();
		// cleanup
		this.#interactionManagerHelper.removeAllSelectedPoints();
		this.clearDownPress();
	}

	public onUp(event: PointerEvent): void {
		// If an edge control was being dragged, commit it.
		const controlsManager = this.#interactionManager.controlsManager;
		if (controlsManager?.isDraggingControl) {
			controlsManager.endDragging();
			this.clearDownPress();
			return;
		}

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
							drawingToolsId: this.#drawingToolsManager.uuid,
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
				if (!this.#drawingToolsManager.settings.general.enableInsertion)
					return;
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

		MobileStrategy.#blockingInstances.delete(
			this.#drawingToolsManager.uuid,
		);
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
