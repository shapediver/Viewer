import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { MultiPointsMaterial } from '@shapediver/viewer.rendering-engine-threejs.standard';
import { vec3 } from 'gl-matrix';

export class InteractionManager implements IManager {
    // #region Properties (9)

    readonly #drawingToolsManager: DrawingToolsManager;

    #dragStart: vec3 = vec3.create();
    #dragging: boolean = false;
    #hoveredPoint?: number;
    #hoveredPointPosition: vec3 = vec3.create();
    #justSelected: boolean = false;
    #moving: boolean = false;
    #selectedPointIndices: number[] = [];
    #selectedPointPositions: vec3[] = [];

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(drawToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawToolsManager;
    }

    // #endregion Constructors (1)

    // #region Public Methods (8)

    /**
     * A point was added so we have to move the selected indices one forward if they are after the insertion index
     * 
     * @param insertionIndex 
     */
    public addPoint(insertionIndex: number): void {
        // move index if it is the hovered index
        if (this.#hoveredPoint !== undefined && this.#hoveredPoint >= insertionIndex) {
            this.#hoveredPoint++;
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
    public checkHover(event: MouseEvent | TouchEvent, ray: IRay): void {
        // check if there is a point close to the ray
        const distances = this.#drawingToolsManager.geometryMathManager.checkDistances(ray, this.#drawingToolsManager.geometryManager.positionArray);
        if (distances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            const index = distances[0].index;

            if (this.#hoveredPoint !== undefined && this.#hoveredPoint === index) return;
            if (this.#hoveredPoint !== undefined) {
                if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, 1);
                } else {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, 0);
                }
            }

            if (this.#selectedPointIndices.includes(index)) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, 3);
            } else {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, 2);
            }

            this.#hoveredPoint = index;
        } else {
            if (this.#hoveredPoint !== undefined) {
                if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, 1);
                } else {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, 0);
                }
            }
            this.#hoveredPoint = undefined;
        }
    }

    public close(): void {
        this.#selectedPointIndices = [];
        this.#hoveredPoint = undefined;
        this.#dragging = false;
        this.#dragStart = vec3.create();
        this.#selectedPointPositions = [];
        this.#hoveredPointPosition = vec3.create();
    }

    /**
     * On mouse down, check if a point is close to the ray and select it
     * 
     * @param event 
     * @param ray 
     * @returns 
     */
    public onDown(event: MouseEvent | TouchEvent, ray: IRay): boolean {
        this.#moving = false;

        if (!this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.customizationProperties.controls.insert)) {
            const distances = this.#drawingToolsManager.geometryMathManager.checkDistances(ray, this.#drawingToolsManager.geometryManager.positionArray);
            if (distances) {
                // add the id if it is not already in the array
                // remove it if it is in the array
                if(!this.#selectedPointIndices.includes(distances[0].index)) {
                    this.selectPoint(distances[0].index);
                    this.#justSelected = true;
                }
            }
        }

        if (this.#selectedPointIndices.length > 0 && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            // store drag start
            // calculate ray intersection with XY plane
            const dot = vec3.dot(ray.direction, vec3.fromValues(0, 0, 1));
            const t = vec3.dot(vec3.sub(vec3.create(), vec3.create(), ray.origin), vec3.fromValues(0, 0, 1)) / dot;
            this.#dragStart = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
            // store selected point positions
            this.#selectedPointIndices.forEach(element =>
                this.#selectedPointPositions.push(
                    vec3.fromValues(
                        this.#drawingToolsManager.geometryManager.positionArray.at(element * 3)!,
                        this.#drawingToolsManager.geometryManager.positionArray.at(element * 3 + 1)!,
                        this.#drawingToolsManager.geometryManager.positionArray.at(element * 3 + 2)!
                    )
                )
            );

            this.#hoveredPointPosition = vec3.fromValues(
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3)!,
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 1)!,
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 2)!
            );

            this.#dragging = true;
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
            return true;
        }
        return false;
    }

    /**
     * On mouse up, check if a point is close to the ray and deselect it
     */
    public onEnd(): void {
        if (this.#justSelected === false && this.#moving === false && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.selectPoint(this.#hoveredPoint);
        } else if (this.#justSelected === true && this.#moving === true && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.selectPoint(this.#hoveredPoint);
        } if ( this.#moving === true && this.#dragging === true) {
            this.removeAllSelectedPoints();
        }
        this.#justSelected = false;
        this.#moving = false;
        this.#dragging = false;
        this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;
        this.#selectedPointPositions = [];
        this.#hoveredPointPosition = vec3.create();
    }

    /**
     * On mouse move, move the selected point if there is one
     * 
     * @param event 
     * @param ray 
     */
    public onMove(event: MouseEvent | TouchEvent, ray: IRay): void {
        this.#moving = true;
        // if there is a selected point, move it
        if (this.#selectedPointIndices.length > 0 && this.#dragging) {
            // calculate ray intersection with XY plane
            const dot = vec3.dot(ray.direction, vec3.fromValues(0, 0, 1));
            const t = vec3.dot(vec3.sub(vec3.create(), vec3.create(), ray.origin), vec3.fromValues(0, 0, 1)) / dot;

            // calculate difference between drag start and current position
            const intersectionPoint = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(t, t, t)));
            const difference = vec3.sub(vec3.create(), intersectionPoint, this.#dragStart);

            const selectedPoint = vec3.add(vec3.create(), difference, this.#hoveredPointPosition);
            const restrictedPoint = this.#drawingToolsManager.restrictionManager.restrictPoint(selectedPoint, this.#hoveredPoint);
            const differenceToRestricted = vec3.sub(vec3.create(), restrictedPoint, this.#hoveredPointPosition);

            for (let i = 0; i < this.#selectedPointIndices.length; i++) {
                // add difference to selected point
                const selectedPoint = vec3.add(vec3.create(), differenceToRestricted, this.#selectedPointPositions[i]);
                this.#drawingToolsManager.geometryManager.movePoint(this.#selectedPointIndices[i], selectedPoint, true);
            }
        } else {
            this.checkHover(event, ray);
        }
    }

    /**
     * Remove all selected points
     */
    public removeAllSelectedPoints(): void {
        this.#selectedPointIndices.forEach(element => this.selectPoint(element));
        this.#selectedPointIndices = [];

        const threeJsPointsGeometry: THREE.Points = this.#drawingToolsManager.geometryManager.geometryData.threeJsObject[this.#drawingToolsManager.viewport.id] as THREE.Points;
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data.forEach((element, i) => {
            (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.image.data[i] = 0;
        });
        (threeJsPointsGeometry.material as MultiPointsMaterial).materialIndexDataTexture!.needsUpdate = true;
        (threeJsPointsGeometry.material as MultiPointsMaterial).needsUpdate = true;
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

    // #endregion Public Methods (8)

    // #region Private Methods (1)

    /**
     * Select a point, deselect it if it is already selected
     * 
     * @param index 
     */
    private selectPoint(index: number): void {
        // add the id if it is not already in the array
        // remove it if it is in the array
        const indexInArray = this.#selectedPointIndices.indexOf(index);
        if (indexInArray === -1) {
            this.#selectedPointIndices.push(index);
            this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, 1);
        } else {
            this.#selectedPointIndices.splice(indexInArray, 1);
            this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, 0);
        }
    }

    // #endregion Private Methods (1)
}