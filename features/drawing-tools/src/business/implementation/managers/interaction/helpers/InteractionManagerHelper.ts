import { DrawingToolsManager, MATERIAL_INDEX } from '../../../DrawingToolsManager';
import { EventEngine, EVENTTYPE_DRAWING_TOOLS } from '@shapediver/viewer.shared.services';
import { GeometryState } from '../../geometry/GeometryState';
import { InteractionManager } from '../InteractionManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { vec3 } from 'gl-matrix';

export class InteractionManagerHelper {
    // #region Properties (13)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #eventEngine = EventEngine.instance;
    readonly #geometryState: GeometryState;
    readonly #interactionManager: InteractionManager;

    #dragStart: vec3 = vec3.create();
    #draggedPoint?: number;
    #draggedPointPosition: vec3 = vec3.create();
    #dragging: boolean = false;
    #hoveredPoint?: number;
    #justSelected: boolean = false;
    #moving: boolean = false;
    #selectedPointIndices: number[] = [];
    #selectedPointPositions: vec3[] = [];

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, interactionManager: InteractionManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#interactionManager = interactionManager;
        this.#geometryState = this.#drawingToolsManager.geometryState;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get dragging(): boolean {
        return this.#dragging;
    }

    public get hoveredPoint(): number | undefined {
        return this.#hoveredPoint;
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

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (11)

    /**
     * A point was added so we have to move the selected indices one forward if they are after the insertion index
     * 
     * @param insertionIndex 
     */
    public addPoint(insertionIndex: number): void {
        // move index if it is the hovered index
        if (this.#hoveredPoint !== undefined && this.#hoveredPoint >= insertionIndex) {
            if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
            } else if (this.#interactionManager.midPointInteractionHandler.midPointInsertionIndex === insertionIndex) {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
            } else {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
            }

            this.#hoveredPoint++;

            if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED_HOVERED);
            } else if (this.#interactionManager.midPointInteractionHandler.midPointInsertionIndex === this.#hoveredPoint) {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION_HOVERED);
            } else {
                this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.HOVERED);
            }
        }

        // move selected indices one forward if they are after the insertion index
        this.#selectedPointIndices.forEach((element, i) => {
            this.#selectedPointIndices[i] = element >= insertionIndex ? element + 1 : element;
        });
    }

    /**
     * Check if there is a point close to the ray and update the hovered point
     * 
     * @param event 
     * @param ray 
     * @returns 
     */
    public checkHover(event: PointerEvent, ray: IRay): void {
        const deleteKeyPressed = this.#interactionManager.keyPressed(event, this.#drawingToolsManager.settings.controls.delete);

        // check if there is a point close to the ray
        const pointDistances = this.#drawingToolsManager.geometryMathManager.checkPointDistances(ray);
        if (pointDistances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            const index = pointDistances[0].index;

            if (deleteKeyPressed && this.#geometryState.canRemovePoint()) {
                this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.DELETION_HOVERED);
            } else {
                if (this.#hoveredPoint !== undefined && this.#hoveredPoint === index) return;
                if (this.#hoveredPoint !== undefined) {
                    if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                        this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
                    } else if (this.#interactionManager.midPointInteractionHandler.midPointInsertionIndex === index) {
                        this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                    } else if (this.#interactionManager.insertionInteractionHandler.insertionActive === true && this.#interactionManager.insertionInteractionHandler.alreadyInserted === true && this.#hoveredPoint === this.#geometryState.getPointCount() - 1) {
                        this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                    } else {
                        this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
                    }
                }

                if (this.#selectedPointIndices.includes(index)) {
                    this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.SELECTED_HOVERED);
                } else if (this.#interactionManager.midPointInteractionHandler.midPointInsertionIndex === index) {
                    this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.INSERTION_HOVERED);
                } else if (this.#interactionManager.insertionInteractionHandler.insertionActive === true && this.#interactionManager.insertionInteractionHandler.alreadyInserted === true && index === this.#geometryState.getPointCount() - 1) {
                    this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.INSERTION_HOVERED);
                } else {
                    this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.HOVERED);
                }
            }

            this.#hoveredPoint = index;
        } else {
            // remove the hovered point if there is no point close to the ray
            if (this.#hoveredPoint !== undefined) {
                if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                    this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
                } else if (this.#interactionManager.midPointInteractionHandler.midPointInsertionIndex === this.#hoveredPoint) {
                    this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                } else if (this.#interactionManager.insertionInteractionHandler.insertionActive === true && this.#interactionManager.insertionInteractionHandler.alreadyInserted === true && this.#hoveredPoint === this.#geometryState.getPointCount() - 1) {
                    this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION_HOVERED);
                } else {
                    this.#drawingToolsManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
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
        this.#dragStart = vec3.create();
        this.#selectedPointPositions = [];
        this.#draggedPointPosition = vec3.create();
    }

    public moveSelectedPoints(ray: IRay): void {
        if (this.#selectedPointIndices.length > 0 && this.#dragging) {
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;

            const intersectionPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, { referencePoint: this.#dragStart });

            if (intersectionPoint) {
                const difference = vec3.sub(vec3.create(), intersectionPoint, this.#dragStart);

                const selectedPoint = vec3.add(vec3.create(), difference, this.#draggedPointPosition);
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.snap(selectedPoint, { index: this.#draggedPoint });

                if (restrictedPoint) {
                    const differenceToRestricted = vec3.sub(vec3.create(), restrictedPoint, this.#draggedPointPosition);

                    for (let i = 0; i < this.#selectedPointIndices.length; i++) {
                        // add difference to selected point
                        const selectedPoint = vec3.add(vec3.create(), differenceToRestricted, this.#selectedPointPositions[i]);
                        this.#drawingToolsManager.movePointTemporary(this.#selectedPointIndices[i], selectedPoint);
                    }

                    this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
                }
            }
        }
    }

    public onOut(): void {
        // reset all selected points to their original position
        this.#selectedPointIndices.forEach((element, i) => {
            this.#drawingToolsManager.movePointTemporary(element, this.#selectedPointPositions[i]);
        });

        if (this.#dragging === true) {
            // reset the dragged point position
            this.#drawingToolsManager.movePointTemporary(this.#draggedPoint!, this.#draggedPointPosition);
        }

        // remove the hovered point and the selected points
        this.removeAllSelectedPoints();
    }

    public onUp(): void {
        if (this.#justSelected === false && this.#moving === false && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.toggleSelection(this.#hoveredPoint);
        } else if (this.#justSelected === true && this.#moving === true && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.toggleSelection(this.#hoveredPoint);
        } if (this.#moving === true && this.#dragging === true) {
            this.removeAllSelectedPoints();
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_END, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
        }
    }

    /**
     * Remove all selected points
     */
    public removeAllSelectedPoints(): void {
        this.#selectedPointIndices.forEach(element => {
            this.toggleSelection(element);
        });
        this.#selectedPointIndices = [];

        this.#drawingToolsManager.resetMaterialIndices();
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

        if (this.#hoveredPoint !== undefined && this.#hoveredPoint > removalIndex) {
            this.#hoveredPoint--;
        }

        // remove index from selected indices
        const indexInArray = this.#selectedPointIndices.indexOf(removalIndex);
        if (indexInArray !== -1) {
            this.#selectedPointIndices.splice(indexInArray, 1);
        }

        // move selected indices one back if they are after the removal index
        this.#selectedPointIndices.forEach((element, i) => {
            this.#selectedPointIndices[i] = element > removalIndex ? element - 1 : element;
        });
    }

    public reset(): void {
        this.#justSelected = false;
        this.#moving = false;
        this.#dragging = false;
        this.#selectedPointPositions = [];
        this.#hoveredPoint = undefined;
    }

    public selectPoint(distances: {
        index: number;
        distance: number;
    }[] | undefined): void {
        if (distances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            if (!this.#selectedPointIndices.includes(distances[0].index)) {
                this.toggleSelection(distances[0].index);
                this.#justSelected = true;
            }
        }
    }

    public startDragging(ray: IRay): boolean {
        if (this.#selectedPointIndices.length > 0 && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            const draggedPoint = this.#geometryState.getPosition(this.#hoveredPoint * 3);

            // store drag start
            const intersectionPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, { referencePoint: draggedPoint });

            if (intersectionPoint) {
                this.#dragStart = intersectionPoint;
                // store selected point positions
                this.#selectedPointIndices.forEach(element =>
                    this.#selectedPointPositions.push(this.#geometryState.getPosition(element * 3))
                );

                this.#draggedPointPosition = this.#geometryState.getPosition(this.#hoveredPoint * 3);

                this.#draggedPoint = this.#hoveredPoint;

                this.#dragging = true;
                this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_START, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });

                return true;
            }
        }
        return false;
    }

    // #endregion Public Methods (11)

    // #region Private Methods (1)

    /**
     * Select a point, deselect it if it is already selected
     * 
     * @param index 
     */
    private toggleSelection(index: number): void {
        // add the id if it is not already in the array
        // remove it if it is in the array
        const indexInArray = this.#selectedPointIndices.indexOf(index);
        if (indexInArray === -1) {
            this.#selectedPointIndices.push(index);
            this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.SELECTED);
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.SELECTED, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid, index });
        } else {
            this.#selectedPointIndices.splice(indexInArray, 1);
            this.#drawingToolsManager.updateMaterialIndex(index, MATERIAL_INDEX.DEFAULT);
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DESELECTED, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid, index });
        }
    }

    // #endregion Private Methods (1)
}