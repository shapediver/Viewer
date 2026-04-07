import {addListener} from "@shapediver/viewer";
import {IRay} from "@shapediver/viewer.features.interaction";
import {
	GeometryMathManager,
	PlaneRestriction,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
} from "@shapediver/viewer.shared.services";

import {vec3} from "gl-matrix";

import {DrawingToolsEventResponseMapping} from "../../../../interfaces/events/EventResponseMapping";
import {
	AdjacencyEntry,
	MATERIAL_INDEX,
	Settings,
} from "../../../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {GeometryState} from "../../geometry/GeometryState";
import {InteractionManager} from "../InteractionManager";

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
	#propagatedBasePositions: Map<number, vec3> = new Map();
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
				if (this.isPointDisabled(this.#hoveredPoint)) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.DISABLED,
					);
				} else if (
					this.#selectedPointIndices.includes(this.#hoveredPoint)
				) {
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

			if (this.isPointDisabled(index)) {
				this.#drawingToolsManager.updateMaterialIndex(
					index,
					MATERIAL_INDEX.DISABLED,
				);
			} else if (this.#selectedPointIndices.includes(index)) {
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
				if (this.isPointDisabled(this.#hoveredPoint)) {
					this.#drawingToolsManager.updateMaterialIndex(
						this.#hoveredPoint,
						MATERIAL_INDEX.DISABLED,
					);
				} else if (
					this.#selectedPointIndices.includes(this.#hoveredPoint)
				) {
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
		this.#propagatedBasePositions.clear();
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
					startPoint: vec3.clone(this.#draggedPointPosition),
					positionArray: this.#drawingToolsManager.positionArray,
				});
			const intersectionPoint = rayTraceResult?.point;

			if (intersectionPoint) {
				const differenceToIntersected = vec3.sub(
					vec3.create(),
					intersectionPoint,
					this.#draggedPointPosition,
				);

				// Phase 1 – compute constrained proposed positions for every
				// directly-selected point, building an overrides map so that
				// each peer's constrained position is visible when checking the
				// next point's size constraint.
				// Seed with drag-start positions of propagated (indirect) points
				// so that constraint checks see stable original positions, not
				// stale values from positionArray that may have been
				// contaminated by temporary moves (e.g. flushRectPoints).
				const overrides = new Map<number, vec3>(
					this.#propagatedBasePositions,
				);
				const constrainedPositions: vec3[] = [];

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

					let rawProposed: vec3;
					if (isLastPoint && canBeClosed && shouldBeClosed) {
						const firstPoint = this.#geometryState.getPosition(0);
						if (
							this.#geometryMathManager.screenSpaceDistanceCheck(
								firstPoint,
								intersectionPoint,
								this.#settings.visualization.points.size_0! *
									this.#settings.visualization
										.distanceMultiplicationFactor,
							).check === true
						) {
							// snap to first point to close the geometry
							rawProposed = vec3.clone(firstPoint);
						} else {
							rawProposed = vec3.add(
								vec3.create(),
								differenceToIntersected,
								this.#selectedPointPositions[i],
							);
						}
					} else {
						rawProposed = vec3.add(
							vec3.create(),
							differenceToIntersected,
							this.#selectedPointPositions[i],
						);
					}

					const constrained =
						this.#drawingToolsManager.applyConstraints(
							rawProposed,
							this.#selectedPointIndices[i],
							overrides,
							this.#selectedPointPositions[i],
						);
					constrainedPositions.push(constrained);
					overrides.set(this.#selectedPointIndices[i], constrained);
				}

				// Effective delta for the dragged point after constraint clamping.
				const draggedSelIdx = this.#selectedPointIndices.indexOf(
					this.#draggedPoint!,
				);
				const effectiveDelta =
					draggedSelIdx >= 0
						? vec3.sub(
								vec3.create(),
								constrainedPositions[draggedSelIdx],
								this.#selectedPointPositions[draggedSelIdx],
							)
						: differenceToIntersected;

				// Phase 2 – compute indirect (constraint-clamped) positions.
				const {indirectPositions, correctedDelta} =
					this.applyAdjacencyPropagation(effectiveDelta, overrides);

				// If indirect constraints required reducing the effective delta
				// per-axis, re-derive direct point positions so that the
				// rectangle invariant (shared coordinates) is maintained.
				if (correctedDelta) {
					for (
						let i = 0;
						i < this.#selectedPointIndices.length;
						i++
					) {
						constrainedPositions[i] = vec3.add(
							vec3.create(),
							this.#selectedPointPositions[i],
							correctedDelta,
						);
						overrides.set(
							this.#selectedPointIndices[i],
							constrainedPositions[i],
						);
					}
				}

				// Phase 3 – apply constrained positions to direct points.
				// Constraints are already applied in Phase 1, skip re-application
				// to avoid stale positionArray reads producing wrong results.
				for (let i = 0; i < this.#selectedPointIndices.length; i++) {
					this.#selectedMovedPointPositions[i] =
						constrainedPositions[i];
					this.#drawingToolsManager.movePoint(
						this.#selectedPointIndices[i],
						constrainedPositions[i],
						rayTraceResult,
						true,
						true,
					);
				}

				// Phase 4 – apply pre-computed indirect positions.
				// Constraints are already applied in Phase 2, skip re-application
				// to avoid stale positionArray reads producing wrong results.
				for (const [targetIdx, pos] of indirectPositions) {
					this.#drawingToolsManager.movePoint(
						targetIdx,
						pos,
						this.#geometryState.metadataArray[targetIdx],
						true,
						true,
					);
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

			// reset any propagated points to their pre-drag positions
			this.#propagatedBasePositions.forEach((basePos, idx) => {
				this.#drawingToolsManager.movePointTemporary(
					idx,
					basePos,
					this.#geometryState.metadataArray[idx],
				);
			});
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
		this.#propagatedBasePositions.clear();
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
			if (this.isPointDisabled(distances[0].index)) return;
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

		// Disabled points cannot be dragged
		if (
			this.#hoveredPoint !== undefined &&
			this.isPointDisabled(this.#hoveredPoint)
		)
			return false;

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
		this.collectPropagatedBasePositions();
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_START, {
			viewportId: this.#drawingToolsManager.viewport.id,
			drawingToolsId: this.#drawingToolsManager.uuid,
		});

		return true;
	}

	/**
	 * Traverse the adjacency graph from all currently selected points and store the
	 * pre-drag world-space position of every reachable non-selected point so that
	 * delta propagation can work from a stable baseline across multiple move frames.
	 */
	private collectPropagatedBasePositions(): void {
		const adjacency = this.#settings.geometry.weightedAdjacency;
		if (!adjacency) return;

		const queue: number[] = [...this.#selectedPointIndices];
		const expanded = new Set<number>(this.#selectedPointIndices);

		while (queue.length > 0) {
			const sourceIdx = queue.shift()!;
			const adjList = adjacency[sourceIdx];
			if (!adjList) continue;

			for (const {to: targetIdx} of adjList) {
				if (this.#selectedPointIndices.includes(targetIdx)) continue;
				if (!this.#propagatedBasePositions.has(targetIdx)) {
					this.#propagatedBasePositions.set(
						targetIdx,
						this.#geometryState.getPosition(targetIdx),
					);
				}
				if (!expanded.has(targetIdx)) {
					expanded.add(targetIdx);
					queue.push(targetIdx);
				}
			}
		}
	}

	/**
	 * Convert a world-space source delta into a weighted propagation delta.
	 *
	 * "world" (default): multiply XYZ components directly by weights.
	 * "local": decompose the delta along the active plane restriction's U/V/N axes,
	 *          apply per-axis weights, then recompose.  Falls back to "world" when no
	 *          enabled plane restriction is present.
	 */
	/**
	 * Find the active plane restriction's local axes (U, V, N).
	 * Returns undefined when no enabled plane restriction is present.
	 */
	private getActivePlaneAxes(): [vec3, vec3, vec3] | undefined {
		const planeRestriction = Object.values(
			this.#drawingToolsManager.restrictionManager.restrictions,
		).find((r) => r.type === RESTRICTION_TYPE.PLANE && r.enabled) as
			| PlaneRestriction
			| undefined;
		if (!planeRestriction) return undefined;
		return [
			planeRestriction.vectorU,
			planeRestriction.vectorV,
			planeRestriction.normal,
		];
	}

	/**
	 * Scale a world-space delta per local axis.
	 * Decomposes into the local U/V/N basis, applies per-axis scale factors,
	 * then recomposes to world space.
	 */
	private scaleInLocalAxes(
		delta: vec3,
		axisScales: [number, number, number],
		localAxes: [vec3, vec3, vec3],
	): vec3 {
		const [u, v, n] = localAxes;
		const result = vec3.create();
		vec3.scaleAndAdd(result, result, u, vec3.dot(delta, u) * axisScales[0]);
		vec3.scaleAndAdd(result, result, v, vec3.dot(delta, v) * axisScales[1]);
		vec3.scaleAndAdd(result, result, n, vec3.dot(delta, n) * axisScales[2]);
		return result;
	}

	private computeWeightedDelta(
		sourceDelta: vec3,
		weights: AdjacencyEntry["weights"],
		space: AdjacencyEntry["space"],
	): vec3 {
		if (space === "local") {
			const localAxes = this.getActivePlaneAxes();

			if (localAxes) {
				const [u, v, n] = localAxes;
				const du = vec3.dot(sourceDelta, u);
				const dv = vec3.dot(sourceDelta, v);
				const dn = vec3.dot(sourceDelta, n);
				const result = vec3.create();
				vec3.scaleAndAdd(result, result, u, du * weights[0]);
				vec3.scaleAndAdd(result, result, v, dv * weights[1]);
				vec3.scaleAndAdd(result, result, n, dn * weights[2]);
				return result;
			}
		}

		return vec3.fromValues(
			sourceDelta[0] * weights[0],
			sourceDelta[1] * weights[1],
			sourceDelta[2] * weights[2],
		);
	}

	/**
	 * BFS propagation of a drag delta through the weightedAdjacency graph.
	 *
	 * Runs the BFS exactly once, validates constraints for every indirect
	 * point, and returns a ready-to-apply position map so the caller can
	 * commit the moves without any redundant computation.
	 *
	 * @param differenceToIntersected  Effective drag delta (already
	 *                                  constraint-clamped for the dragged point).
	 * @param overrides                 Positions of directly-moved points, used
	 *                                  as reference geometry when checking size
	 *                                  constraints for indirect points.
	 * @returns Indirect positions and, when indirect constraints required
	 *          reducing the effective delta, a correctedDelta for the caller
	 *          to re-derive direct point positions from.
	 */
	private applyAdjacencyPropagation(
		differenceToIntersected: vec3,
		overrides?: Map<number, vec3>,
	): {
		indirectPositions: Map<number, vec3>;
		correctedDelta?: vec3;
	} {
		const adjacency = this.#settings.geometry.weightedAdjacency;
		if (!adjacency || this.#propagatedBasePositions.size === 0)
			return {indirectPositions: new Map()};

		// Seed BFS from all selected points.
		const queue: [number, vec3][] = this.#selectedPointIndices.map(
			(idx) => [idx, differenceToIntersected],
		);
		const expanded = new Set<number>(this.#selectedPointIndices);
		const accumulatedDeltas = new Map<number, vec3>();

		const processSource = (sourceIdx: number, sourceDelta: vec3): void => {
			const adjList = adjacency[sourceIdx];
			if (!adjList) return;

			for (const entry of adjList) {
				const {to: targetIdx, weights, space} = entry;
				if (this.#selectedPointIndices.includes(targetIdx)) continue;

				const weightedDelta = this.computeWeightedDelta(
					sourceDelta,
					weights,
					space,
				);

				if (accumulatedDeltas.has(targetIdx)) {
					vec3.add(
						accumulatedDeltas.get(targetIdx)!,
						accumulatedDeltas.get(targetIdx)!,
						weightedDelta,
					);
				} else {
					accumulatedDeltas.set(targetIdx, vec3.clone(weightedDelta));
				}

				// Queue target for chain propagation (using its received delta).
				if (!expanded.has(targetIdx)) {
					expanded.add(targetIdx);
					queue.push([targetIdx, weightedDelta]);
				}
			}
		};

		while (queue.length > 0) {
			const [sourceIdx, sourceDelta] = queue.shift()!;
			processSource(sourceIdx, sourceDelta);
		}

		// Detect whether any adjacency entry uses "local" space so the
		// correction path can operate along the plane restriction's U/V/N axes
		// instead of world X/Y/Z.  This ensures correct behavior even when the
		// geometry is rotated relative to the world frame.
		let localAxes: [vec3, vec3, vec3] | undefined;
		outer: for (const list of adjacency) {
			for (const entry of list) {
				if (entry.space === "local") {
					localAxes = this.getActivePlaneAxes();
					break outer;
				}
			}
		}

		// First pass: check constraints and compute per-axis scale factors.
		// When an indirect point is clamped on axis i, we determine how much
		// the source delta on that axis must be reduced so the indirect point
		// lands exactly at the constraint boundary. The most restrictive
		// (smallest) scale factor per axis wins.
		// When localAxes is set, "axis i" refers to the plane's U/V/N axes;
		// otherwise it refers to world X/Y/Z.
		const axisScales: [number, number, number] = [1, 1, 1];
		let needsCorrection = false;

		for (const [targetIdx, delta] of accumulatedDeltas) {
			const base = this.#propagatedBasePositions.get(targetIdx);
			if (!base) continue;
			const proposed = vec3.add(vec3.create(), base, delta);
			const constrained = this.#drawingToolsManager.applyConstraints(
				proposed,
				targetIdx,
				overrides,
				base,
			);

			if (localAxes) {
				// Decompose delta and correction along local U/V/N axes.
				const diff = vec3.sub(vec3.create(), constrained, base);
				for (let i = 0; i < 3; i++) {
					const deltaLocal = vec3.dot(delta, localAxes[i]);
					const constrainedLocal = vec3.dot(diff, localAxes[i]);
					if (
						Math.abs(deltaLocal) > 1e-10 &&
						Math.abs(constrainedLocal - deltaLocal) > 1e-10
					) {
						const scale = Math.max(
							0,
							constrainedLocal / deltaLocal,
						);
						if (scale < axisScales[i]) {
							axisScales[i] = scale;
							needsCorrection = true;
						}
					}
				}
			} else {
				for (let i = 0; i < 3; i++) {
					if (
						Math.abs(delta[i]) > 1e-10 &&
						Math.abs(constrained[i] - proposed[i]) > 1e-10
					) {
						const scale = Math.max(
							0,
							(constrained[i] - base[i]) / delta[i],
						);
						if (scale < axisScales[i]) {
							axisScales[i] = scale;
							needsCorrection = true;
						}
					}
				}
			}
		}

		if (!needsCorrection) {
			// All proposed positions satisfy constraints.
			const indirectPositions = new Map<number, vec3>();
			for (const [targetIdx, delta] of accumulatedDeltas) {
				const base = this.#propagatedBasePositions.get(targetIdx);
				if (!base) continue;
				indirectPositions.set(
					targetIdx,
					vec3.add(vec3.create(), base, delta),
				);
			}
			return {indirectPositions};
		}

		// Compute corrected effective delta (scaled per-axis).
		const correctedDelta = localAxes
			? this.scaleInLocalAxes(
					differenceToIntersected,
					axisScales,
					localAxes,
				)
			: vec3.fromValues(
					differenceToIntersected[0] * axisScales[0],
					differenceToIntersected[1] * axisScales[1],
					differenceToIntersected[2] * axisScales[2],
				);

		// Recompute indirect positions using the scaled deltas.
		const indirectPositions = new Map<number, vec3>();
		for (const [targetIdx, delta] of accumulatedDeltas) {
			const base = this.#propagatedBasePositions.get(targetIdx);
			if (!base) continue;
			const scaledDelta = localAxes
				? this.scaleInLocalAxes(delta, axisScales, localAxes)
				: vec3.fromValues(
						delta[0] * axisScales[0],
						delta[1] * axisScales[1],
						delta[2] * axisScales[2],
					);
			indirectPositions.set(
				targetIdx,
				vec3.add(vec3.create(), base, scaledDelta),
			);
		}

		return {indirectPositions, correctedDelta};
	}

	/**
	 * Select a point, deselect it if it is already selected
	 *
	 * @param index
	 */
	public toggleSelection(index: number): void {
		// Disabled points cannot be selected
		if (this.isPointDisabled(index)) return;
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

	private isPointDisabled(index: number): boolean {
		return this.#settings.geometry.disabledPoints?.includes(index) ?? false;
	}
}
