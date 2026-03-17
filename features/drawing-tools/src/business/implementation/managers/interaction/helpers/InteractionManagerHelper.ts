import {addListener} from "@shapediver/viewer";
import {IRay} from "@shapediver/viewer.features.interaction";
import {GeometryMathManager} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
} from "@shapediver/viewer.shared.services";

import {vec3} from "gl-matrix";

import {
	MATERIAL_INDEX,
	Settings,
} from "../../../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {GeometryState} from "../../geometry/GeometryState";
import {InteractionManager} from "../InteractionManager";
import {DrawingToolsEventResponseMapping} from "../../../../interfaces/events/EventResponseMapping";

export class InteractionManagerHelper {
	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #eventEngine = EventEngine.instance;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #geometryState: GeometryState;
	readonly #interactionManager: InteractionManager;
	readonly #settings: Settings;

	#draggedPoint?: number;
	#draggedPointPosition: vec3 = vec3.create();
	#dragging: boolean = false;
	#hoveredPoint?: number;
	#justSelected: boolean = false;
	#lastRay: IRay | undefined;
	#midPointInserted: boolean = false;
	#moving: boolean = false;
	#selectedMovedPointPositions: vec3[] = [];
	#selectedPointIndices: number[] = [];
	#selectedPointPositions: vec3[] = [];

	constructor(
		drawingToolsManager: DrawingToolsManager,
		interactionManager: InteractionManager,
	) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#interactionManager = interactionManager;
		this.#geometryState = this.#drawingToolsManager.geometryState;
		this.#geometryMathManager =
			this.#drawingToolsManager.geometryMathManager;
		this.#settings = this.#drawingToolsManager.settings;

		addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
			if (event.drawingToolsId !== this.#drawingToolsManager.uuid) return;
			this.removeAllSelectedPoints();
		});
	}

	public get dragging(): boolean {
		return this.#dragging;
	}

	public get hoveredPoint(): number | undefined {
		return this.#hoveredPoint;
	}

	public set hoveredPoint(value: number | undefined) {
		this.#hoveredPoint = value;
	}

	public get midPointInserted(): boolean {
		return this.#midPointInserted;
	}

	public set midPointInserted(value: boolean) {
		this.#midPointInserted = value;
	}

	public get moving(): boolean {
		return this.#moving;
	}

	public set moving(value: boolean) {
		this.#moving = value;
	}

	public get selectedPointIndices(): number[] {
		return this.#selectedPointIndices;
	}

	/**
	 * A point was added so we have to move the selected indices one forward if they are after the insertion index
	 *
	 * @param insertionIndex
	 */
	public addPoint(insertionIndex: number): void {
		// move index if it is the hovered index
		if (
			this.#hoveredPoint !== undefined &&
			this.#hoveredPoint >= insertionIndex
		) {
			if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.SELECTED,
				);
			} else if (
				this.#interactionManager.midPointInteractionHandler
					.midPointInsertionIndex === insertionIndex
			) {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.INSERTION,
				);
			} else {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.DEFAULT,
				);
			}

			this.#hoveredPoint++;

			if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.SELECTED_HOVERED,
				);
			} else if (
				this.#interactionManager.midPointInteractionHandler
					.midPointInsertionIndex === this.#hoveredPoint
			) {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.INSERTION_HOVERED,
				);
			} else {
				this.#drawingToolsManager.updateMaterialIndex(
					this.#hoveredPoint,
					MATERIAL_INDEX.HOVERED,
				);
			}
		}

		// move selected indices one forward if they are after the insertion index
		this.#selectedPointIndices.forEach((element, i) => {
			this.#selectedPointIndices[i] =
				element >= insertionIndex ? element + 1 : element;
		});
	}

	/**
	 * Check if there is a point close to the ray and update the hovered point
	 *
	 * @param event
	 * @param ray
	 * @returns
	 */
	public checkHover(
		distances?: {index: number; distance: number}[],
		ray?: IRay,
	): void {
		if (!ray && !this.#lastRay) return;
		if (!ray) ray = this.#lastRay!;
		this.#lastRay = ray;

		// check if there is a point close to the ray
		if (distances) {
			// add the id if it is not already in the array
			// remove it if it is in the array
			const index = distances[0].index;

			if (
				this.#hoveredPoint !== undefined &&
				this.#hoveredPoint === index
			)
				return;
			if (this.#hoveredPoint !== undefined) {
				if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.SELECTED,
					);
				} else if (
					this.#interactionManager.midPointInteractionHandler
						.midPointInsertionIndex === index
				) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.INSERTION,
					);
				} else if (
					this.#interactionManager.insertionInteractionHandler
						.insertionActive === true &&
					this.#interactionManager.insertionInteractionHandler
						.alreadyInserted === true &&
					this.#hoveredPoint ===
						this.#geometryState.getPointCount() - 1
				) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.INSERTION,
					);
				} else {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.DEFAULT,
					);
				}
			}

			if (this.#selectedPointIndices.includes(index)) {
				this.#drawingToolsManager.updateMaterialIndex(
					index,
					MATERIAL_INDEX.SELECTED_HOVERED,
				);
			} else if (
				this.#interactionManager.midPointInteractionHandler
					.midPointInsertionIndex === index
			) {
				this.#drawingToolsManager.updateMaterialIndex(
					index,
					MATERIAL_INDEX.INSERTION_HOVERED,
				);
			} else if (
				this.#interactionManager.insertionInteractionHandler
					.insertionActive === true &&
				this.#interactionManager.insertionInteractionHandler
					.alreadyInserted === true &&
				index === this.#geometryState.getPointCount() - 1
			) {
				this.#drawingToolsManager.updateMaterialIndex(
					index,
					MATERIAL_INDEX.INSERTION_HOVERED,
				);
			} else {
				this.#drawingToolsManager.updateMaterialIndex(
					index,
					MATERIAL_INDEX.HOVERED,
				);
			}

			this.#hoveredPoint = index;
		} else {
			// remove the hovered point if there is no point close to the ray
			if (this.#hoveredPoint !== undefined) {
				if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.SELECTED,
					);
				} else if (
					this.#interactionManager.midPointInteractionHandler
						.midPointInsertionIndex === this.#hoveredPoint
				) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.INSERTION,
					);
				} else if (
					this.#interactionManager.insertionInteractionHandler
						.insertionActive === true &&
					this.#interactionManager.insertionInteractionHandler
						.alreadyInserted === true &&
					this.#hoveredPoint ===
						this.#geometryState.getPointCount() - 1
				) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.INSERTION_HOVERED,
					);
				} else {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.DEFAULT,
					);
				}
			}
			this.#hoveredPoint = undefined;
		}
	}

	public close(): void {
		this.#selectedPointIndices = [];
		this.#hoveredPoint = undefined;
		this.#draggedPoint = undefined;
		this.#dragging = false;
		this.#selectedPointPositions = [];
		this.#selectedMovedPointPositions = [];
		this.#draggedPointPosition = vec3.create();
	}

	public deselectPoint(index: number): void {
		const selectedIndex = this.#selectedPointIndices.indexOf(index);
		if (selectedIndex !== -1) {
			this.#selectedPointIndices.splice(selectedIndex, 1);
			this.#drawingToolsManager.updateMaterialIndex(
				index,
				this.#hoveredPoint === index
					? MATERIAL_INDEX.HOVERED
					: MATERIAL_INDEX.DEFAULT,
			);
			this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DESELECTED, {
				viewportId: this.#drawingToolsManager.viewport.id,
				drawingToolsId: this.#drawingToolsManager.uuid,
				index,
			});
		}
	}

	public moveSelectedPoints(ray: IRay): vec3 | undefined {
		if (this.#selectedPointIndices.length > 0 && this.#dragging) {
			this.#drawingToolsManager.restrictionManager.showRestrictionVisualization =
				true;

			const rayTraceResult =
				this.#drawingToolsManager.restrictionManager.rayTrace(ray, {
					type: "drawing",
					index: this.#draggedPoint!,
					startPoint: this.#draggedPointPosition,
					positionArray: this.#drawingToolsManager.positionArray,
				});
			const intersectionPoint = rayTraceResult?.point;

			if (intersectionPoint) {
				const differenceToIntersected = vec3.sub(
					vec3.create(),
					intersectionPoint,
					this.#draggedPointPosition,
				);

				for (let i = 0; i < this.#selectedPointIndices.length; i++) {
					const isLastPoint =
						this.#selectedPointIndices.length === 1 &&
						this.#selectedPointIndices[0] ===
							this.#geometryState.getPointCount() - 1;
					const canBeClosed =
						this.#settings.geometry.mode === "lines" &&
						this.#geometryState.getPointCount() > 3 &&
						this.#geometryState.checkNumberOfPoints(
							this.#geometryState.getPointCount() - 1,
						);
					const shouldBeClosed =
						this.#settings.geometry.close === true &&
						this.#geometryState.closeLoop === false &&
						this.#settings.geometry.autoClose === false;

					if (isLastPoint && canBeClosed && shouldBeClosed) {
						// if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
						const firstPoint = this.#geometryState.getPosition(0);
						const lastPoint = intersectionPoint;

						if (
							lastPoint &&
							this.#geometryMathManager.screenSpaceDistanceCheck(
								firstPoint,
								lastPoint,
								this.#settings.visualization.points.size_0! *
									this.#settings.visualization
										.distanceMultiplicationFactor,
							).check === true
						) {
							// close the geometry
							this.#selectedMovedPointPositions[i] =
								vec3.clone(firstPoint);
							this.#drawingToolsManager.movePointTemporary(
								this.#selectedPointIndices[i],
								firstPoint,
								rayTraceResult,
							);
						} else {
							// not close enough to close the geometry
							this.#selectedMovedPointPositions[i] = vec3.add(
								vec3.create(),
								differenceToIntersected,
								this.#selectedPointPositions[i],
							);
							this.#drawingToolsManager.movePointTemporary(
								this.#selectedPointIndices[i],
								this.#selectedMovedPointPositions[i],
								rayTraceResult,
							);
						}
					} else {
						// add difference to selected point
						this.#selectedMovedPointPositions[i] = vec3.add(
							vec3.create(),
							differenceToIntersected,
							this.#selectedPointPositions[i],
						);
						this.#drawingToolsManager.movePointTemporary(
							this.#selectedPointIndices[i],
							this.#selectedMovedPointPositions[i],
							rayTraceResult,
						);
					}
				}

				this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE, {
					viewportId: this.#drawingToolsManager.viewport.id,
					drawingToolsId: this.#drawingToolsManager.uuid,
					points: this.#geometryState.getPointsData(),
					index:
						this.#selectedPointIndices.length === 1
							? this.#selectedPointIndices[0]
							: undefined,
					indices:
						this.#selectedPointIndices.length > 1
							? this.#selectedPointIndices
							: undefined,
					metaData: this.#geometryState.metadataArray,
				});
			}

			return intersectionPoint;
		}
	}

	public onOut(): void {
		if (this.#dragging === true) {
			// reset all selected points to their original position
			this.#selectedPointIndices.forEach((element, i) => {
				this.#drawingToolsManager.movePointTemporary(
					element,
					this.#selectedPointPositions[i],
					this.#geometryState.metadataArray[element],
				);
			});

			// reset the dragged point position
			this.#drawingToolsManager.movePointTemporary(
				this.#draggedPoint!,
				this.#draggedPointPosition,
				this.#geometryState.metadataArray[this.#draggedPoint!],
			);
		}

		// remove the hovered point and the selected points
		this.removeAllSelectedPoints();
	}

	public onUp(): void {
		if (this.#moving === true && this.#dragging === true) {
			const selectedPointIndices = this.#selectedPointIndices.slice();
			for (let i = 0; i < this.#selectedPointIndices.length; i++)
				this.#geometryState.makePointPersistent(
					this.#selectedPointIndices[i],
					false,
				);

			/**
			 * Check if the geometry should be closed
			 */
			const isLastPoint =
				selectedPointIndices.length === 1 &&
				selectedPointIndices[0] ===
					this.#geometryState.getPointCount() - 1;
			const canBeClosed =
				this.#settings.geometry.mode === "lines" &&
				this.#geometryState.getPointCount() > 3 &&
				this.#geometryState.checkNumberOfPoints(
					this.#geometryState.getPointCount() - 1,
				);
			const shouldBeClosed =
				this.#settings.geometry.close === true &&
				this.#geometryState.closeLoop === false &&
				this.#settings.geometry.autoClose === false;

			if (isLastPoint && canBeClosed && shouldBeClosed) {
				// if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
				const firstPoint = this.#geometryState.getPosition(0);
				const lastPoint = this.#selectedMovedPointPositions[0];

				if (
					lastPoint &&
					this.#geometryMathManager.screenSpaceDistanceCheck(
						firstPoint,
						lastPoint,
						this.#settings.visualization.points.size_0! *
							this.#settings.visualization
								.distanceMultiplicationFactor,
					).check === true
				) {
					// close the geometry
					this.#geometryState.closeLoop = true;
					this.#drawingToolsManager.removePoint(
						selectedPointIndices[0],
					);
				}
			}
			this.removeAllSelectedPoints();

			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED,
				{
					viewportId: this.#drawingToolsManager.viewport.id,
					drawingToolsId: this.#drawingToolsManager.uuid,
					points: this.#geometryState.getPointsData(),
					metaData: this.#geometryState.metadataArray,
					temporary: false,
					fromHistory: false,
				},
			);

			this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_END, {
				viewportId: this.#drawingToolsManager.viewport.id,
				drawingToolsId: this.#drawingToolsManager.uuid,
				points: this.#geometryState.getPointsData(),
				index:
					selectedPointIndices.length === 1
						? selectedPointIndices[0]
						: undefined,
				indices:
					selectedPointIndices.length > 1
						? selectedPointIndices
						: undefined,
				metaData: this.#geometryState.metadataArray,
			});
		} else if (
			this.#hoveredPoint !== undefined &&
			this.#selectedPointIndices.includes(this.#hoveredPoint)
		) {
			if (this.#justSelected === this.#moving)
				this.toggleSelection(this.#hoveredPoint);

			if (this.#midPointInserted) {
				/**
				 * SPECIAL CASE:
				 * - A MIDPOINT WAS ADDED, BUT NOT DRAGGED
				 * - HAS TO BE ADDED TO THE HISTORY NOW
				 */
				this.#eventEngine.emitEvent(
					EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED,
					{
						viewportId: this.#drawingToolsManager.viewport.id,
						drawingToolsId: this.#drawingToolsManager.uuid,
						points: this.#geometryState.getPointsData(),
						metaData: this.#geometryState.metadataArray,
						temporary: false,
					},
				);
			}
		}
	}

	/**
	 * Remove all selected points
	 */
	public removeAllSelectedPoints(): void {
		while (this.#selectedPointIndices.length > 0)
			this.toggleSelection(this.#selectedPointIndices[0]);
	}

	/**
	 * A point was removed so we have to move the selected indices one back if they are after the removal index
	 *
	 * @param removalIndex
	 */
	public removePoint(removalIndex: number): void {
		// remove index if it is the hovered index
		if (this.#hoveredPoint === removalIndex) {
			this.#hoveredPoint = undefined;
		}

		if (
			this.#hoveredPoint !== undefined &&
			this.#hoveredPoint > removalIndex
		) {
			this.#hoveredPoint--;
		}

		// remove index from selected indices
		const indexInArray = this.#selectedPointIndices.indexOf(removalIndex);
		if (indexInArray !== -1) {
			this.#selectedPointIndices.splice(indexInArray, 1);
		}

		// move selected indices one back if they are after the removal index
		this.#selectedPointIndices.forEach((element, i) => {
			this.#selectedPointIndices[i] =
				element > removalIndex ? element - 1 : element;
		});
	}

	public reset(): void {
		this.#justSelected = false;
		this.#midPointInserted = false;
		this.#moving = false;
		this.#dragging = false;
		this.#selectedPointPositions = [];
		this.#selectedMovedPointPositions = [];
	}

	public selectPoint(
		distances:
			| {
					index: number;
					distance: number;
			  }[]
			| undefined,
	): void {
		if (distances) {
			// add the id if it is not already in the array
			// remove it if it is in the array
			if (!this.#selectedPointIndices.includes(distances[0].index)) {
				this.toggleSelection(distances[0].index);
				this.#justSelected = true;
			}
		}
	}

	public startDragging(): boolean {
		const selectedAndHovered =
			this.#selectedPointIndices.length > 0 &&
			this.#hoveredPoint !== undefined &&
			this.#selectedPointIndices.includes(this.#hoveredPoint);

		// Fallback: when no points are selected but a point is hovered, drag it
		// directly. This supports translation without requiring selection.
		const hoverOnlyDrag =
			!selectedAndHovered &&
			this.#selectedPointIndices.length === 0 &&
			this.#hoveredPoint !== undefined;

		if (!selectedAndHovered && !hoverOnlyDrag) return false;

		if (hoverOnlyDrag) {
			// Temporarily track the hovered point so moveSelectedPoints works.
			// It is cleaned up by removeAllSelectedPoints() in onUp().
			this.#selectedPointIndices.push(this.#hoveredPoint!);
		}

		// store selected point positions
		this.#selectedPointIndices.forEach((element) =>
			this.#selectedPointPositions.push(
				this.#geometryState.getPosition(element),
			),
		);

		// copy values into selected moved point positions
		this.#selectedMovedPointPositions = this.#selectedPointPositions.map(
			(element) => vec3.clone(element),
		);

		this.#draggedPointPosition = this.#geometryState.getPosition(
			this.#hoveredPoint!,
		);

		this.#draggedPoint = this.#hoveredPoint;

		this.#dragging = true;
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_START, {
			viewportId: this.#drawingToolsManager.viewport.id,
			drawingToolsId: this.#drawingToolsManager.uuid,
		});

		return true;
	}

	/**
	 * Select a point, deselect it if it is already selected
	 *
	 * @param index
	 */
	public toggleSelection(index: number): void {
		// add the id if it is not already in the array
		// remove it if it is in the array
		const indexInArray = this.#selectedPointIndices.indexOf(index);
		if (indexInArray === -1) {
			this.#selectedPointIndices.push(index);
			this.#drawingToolsManager.updateMaterialIndex(
				index,
				this.#hoveredPoint === index
					? MATERIAL_INDEX.SELECTED_HOVERED
					: MATERIAL_INDEX.SELECTED,
			);
			this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.SELECTED, {
				viewportId: this.#drawingToolsManager.viewport.id,
				drawingToolsId: this.#drawingToolsManager.uuid,
				index,
			});
		} else {
			this.#selectedPointIndices.splice(indexInArray, 1);
			this.#drawingToolsManager.updateMaterialIndex(
				index,
				this.#hoveredPoint === index
					? MATERIAL_INDEX.HOVERED
					: MATERIAL_INDEX.DEFAULT,
			);
			this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DESELECTED, {
				viewportId: this.#drawingToolsManager.viewport.id,
				drawingToolsId: this.#drawingToolsManager.uuid,
				index,
			});
		}
	}
}
