import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { vec3 } from 'gl-matrix';
import { FLAG_TYPE } from '@shapediver/viewer';
import { MATERIAL_INDEX } from './GeometryManager';
import { EVENTTYPE_DRAWING_TOOLS, EventEngine, ShapeDiverViewerDrawingToolsError } from '@shapediver/viewer.shared.services';

export class InteractionManager implements IManager {
    // #region Properties (19)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #eventEngine = EventEngine.instance;

    #alreadyInserted: boolean = false;
    #cameraFreezeFlag: string = '';
    #dragStart: vec3 = vec3.create();
    #draggedPoint?: number;
    #draggedPointPosition: vec3 = vec3.create();
    #dragging: boolean = false;
    #hoveredPoint?: number;
    #hoveredPointPosition: vec3 = vec3.create();
    #insertionActive: boolean = false;
    #insertionActiveClosed: boolean = false;
    #justSelected: boolean = false;
    #lastEvent?: MouseEvent | TouchEvent;
    #midPointInsertionActive: boolean = false;
    #midPointInsertionIndex: number = -1;
    #moving: boolean = false;
    #selectedPointIndices: number[] = [];
    #selectedPointPositions: vec3[] = [];

    // #endregion Properties (19)

    // #region Constructors (1)

    constructor(drawToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawToolsManager;
    }

    // #endregion Constructors (1)

    // #region Public Methods (11)

    /**
     * A point was added so we have to move the selected indices one forward if they are after the insertion index
     * 
     * @param insertionIndex 
     */
    public addPoint(insertionIndex: number, position?: vec3): void {
        // move index if it is the hovered index
        if (this.#hoveredPoint !== undefined && this.#hoveredPoint >= insertionIndex) {
            if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
            } else if (this.#midPointInsertionIndex === insertionIndex) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
            } else {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
            }

            this.#hoveredPoint++;

            if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED_HOVERED);
            } else if (this.#midPointInsertionIndex === this.#hoveredPoint) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION_HOVERED);
            } else {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.HOVERED);
            }
        }

        // move selected indices one forward if they are after the insertion index
        this.#selectedPointIndices.forEach((element, i) => {
            this.#selectedPointIndices[i] = element >= insertionIndex ? element + 1 : element;
        });

        this.#drawingToolsManager.geometryManager.addPoint(insertionIndex, position);
    }

    /**
     * Check if there is a point close to the ray and update the hovered point
     * 
     * @param event 
     * @param ray 
     * @returns 
     */
    public checkHover(event: MouseEvent | TouchEvent, ray: IRay): void {
        const deleteKeyPressed = this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.settings.controls.delete);

        // check if there is a point close to the ray
        const pointDistances = this.#drawingToolsManager.geometryMathManager.checkPointDistances(ray);
        if (pointDistances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            const index = pointDistances[0].index;

            if (deleteKeyPressed) {
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.DELETION_HOVERED);
            } else {
                if (this.#hoveredPoint !== undefined && this.#hoveredPoint === index) return;
                if (this.#hoveredPoint !== undefined) {
                    if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                        this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
                    } else if(this.#midPointInsertionIndex === index) {
                        this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                    } else if(this.#insertionActive === true && this.#alreadyInserted === true && this.#hoveredPoint === this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1) {
                        this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                    } else {
                        this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
                    }
                }
    
                if (this.#selectedPointIndices.includes(index)) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.SELECTED_HOVERED);
                } else if (this.#midPointInsertionIndex === index) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.INSERTION_HOVERED);
                } else if(this.#insertionActive === true && this.#alreadyInserted === true && index === this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.INSERTION_HOVERED);
                } else {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.HOVERED);
                }
            }

            this.#hoveredPoint = index;
        } else {
            // remove the hovered point if there is no point close to the ray
            if (this.#hoveredPoint !== undefined) {
                if (this.#selectedPointIndices.includes(this.#hoveredPoint)) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.SELECTED);
                } else if (this.#midPointInsertionIndex === this.#hoveredPoint) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION);
                } else if(this.#insertionActive === true && this.#alreadyInserted === true && this.#hoveredPoint === this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1) {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.INSERTION_HOVERED);
                } else {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#hoveredPoint, MATERIAL_INDEX.DEFAULT);
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
        this.#hoveredPointPosition = vec3.create();
        this.#draggedPointPosition = vec3.create();
    }

    public onDown(event: MouseEvent | TouchEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;
        this.#moving = false;

        const deleteKeyPressed = this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.settings.controls.delete);
        const insertKeyPressed = this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.settings.controls.insert);

        /**
         * IF DELETE AND INSERT KEY ARE PRESSED
         * DO NOTHING
         */
        if (deleteKeyPressed === true && insertKeyPressed === true) return;

        /**
         * IF DELETE KEY IS PRESSED
         * REMOVE POINT IF THERE IS ONE CLOSE TO THE RAY
         */
        if (deleteKeyPressed) {
            // check if there is a point close to the ray
            const distances = this.#drawingToolsManager.geometryMathManager.checkPointDistances(ray);
            if (distances) {
                // add the id if it is not already in the array
                // remove it if it is in the array
                this.removePoint(distances[0].index);            
                this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.REMOVED, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
            }

            if (!this.#cameraFreezeFlag)
                this.#cameraFreezeFlag = this.#drawingToolsManager.viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        }

        /**
         * IF INSERT KEY IS PRESSED
         * FINALIZE INSERTION
         */
        if (insertKeyPressed) {
            if(this.#insertionActive === true && this.#alreadyInserted === true) {
                if(this.#insertionActiveClosed === true) {
                    this.#insertionActiveClosed = false;
                    this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
                    const numberOfPoints = this.#drawingToolsManager.geometryManager.positionArray.length / 3;
                    if(this.#drawingToolsManager.settings.geometry.minPoints !== undefined && numberOfPoints < this.#drawingToolsManager.settings.geometry.minPoints) {
                        throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#drawingToolsManager.settings.geometry.minPoints);
                    } else if(this.#drawingToolsManager.settings.geometry.maxPoints !== undefined && numberOfPoints > this.#drawingToolsManager.settings.geometry.maxPoints) {
                        throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#drawingToolsManager.settings.geometry.maxPoints);
                    } else {
                        this.#drawingToolsManager.finish();
                        return;
                    }
                } else {
                    this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1, MATERIAL_INDEX.DEFAULT);
                    this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.INSERTED, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
                }
            }

            this.#insertionActive = false;
            this.#alreadyInserted = false;
        }

        /**
         * CHECK HOVERED POINT
         */
        this.checkHover(event, ray);

        /**
         * IF INSERT OR DELETE KEY IS PRESSED
         * WE DO NOT WANT TO SELECT / DESELECT A POINT
         */
        if (insertKeyPressed === true || deleteKeyPressed === true) return;

        const distances = this.#drawingToolsManager.geometryMathManager.checkPointDistances(ray);

        /**
         * IF MID POINT INSERTION IS ACTIVE
         * FINISH MID POINT INSERTION IF THE CURRENT INDEX IS THE MID POINT INSERTION INDEX
         */
        if (this.#midPointInsertionActive === true) {
            if (distances) {
                // finish mid point insertion if it is the current index
                if (distances[0].index === this.#midPointInsertionIndex) {
                    this.#midPointInsertionActive = false;
                    this.#midPointInsertionIndex = -1;                    
                    this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.INSERTED, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
                }
            }
        }

        if (distances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            if (!this.#selectedPointIndices.includes(distances[0].index)) {
                this.toggleSelection(distances[0].index);
                this.#justSelected = true;
            }
        }

        /**
         * IF THE CURRENTLY HOVERED POINT IS SELECTED
         * START DRAGGING
         */
        if (this.#selectedPointIndices.length > 0 && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {

            const draggedPoint = vec3.fromValues(
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3)!,
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 1)!,
                this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 2)!
            );

            // store drag start
            const intersectionPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, {referencePoint: draggedPoint});

            if(intersectionPoint) {
                this.#dragStart = intersectionPoint;
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
    
                this.#draggedPointPosition = vec3.fromValues(
                    this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3)!,
                    this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 1)!,
                    this.#drawingToolsManager.geometryManager.positionArray.at(this.#hoveredPoint * 3 + 2)!
                );
    
                this.#draggedPoint = this.#hoveredPoint;
    
                this.#dragging = true;
                this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_START, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
    
                if (!this.#cameraFreezeFlag)
                    this.#cameraFreezeFlag = this.#drawingToolsManager.viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
            }
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.closed) return;

        const insertKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.insert);
        const cancelKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.cancel);
        const finishKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.finish);
        const deleteKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.delete);
        const updateKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.update);


        /**
         * IF FINISH KEY IS PRESSED
         * CLOSE THE DRAWING TOOLS
         */
        if (finishKeyPressed) {
            const numberOfPoints = this.#drawingToolsManager.geometryManager.positionArray.length / 3;
            if(this.#drawingToolsManager.settings.geometry.minPoints !== undefined && numberOfPoints < this.#drawingToolsManager.settings.geometry.minPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#drawingToolsManager.settings.geometry.minPoints);
            } else if(this.#drawingToolsManager.settings.geometry.maxPoints !== undefined && numberOfPoints > this.#drawingToolsManager.settings.geometry.maxPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#drawingToolsManager.settings.geometry.maxPoints);
            } else {
                this.#drawingToolsManager.finish();
            }
        }

        /**
         * IF UPDATE KEY IS PRESSED
         * UPDATE THE DRAWING TOOLS
         */
        if (updateKeyPressed) {
            const numberOfPoints = this.#drawingToolsManager.geometryManager.positionArray.length / 3;
            if(this.#drawingToolsManager.settings.geometry.minPoints !== undefined && numberOfPoints < this.#drawingToolsManager.settings.geometry.minPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Not enough points, minimum points: ' + this.#drawingToolsManager.settings.geometry.minPoints);
            } else if(this.#drawingToolsManager.settings.geometry.maxPoints !== undefined && numberOfPoints > this.#drawingToolsManager.settings.geometry.maxPoints) {
                throw new ShapeDiverViewerDrawingToolsError('Too many points, maximum points: ' + this.#drawingToolsManager.settings.geometry.maxPoints);
            } else {
                this.#drawingToolsManager.update();
            }
        }

        /**
         * IF CANCEL KEY IS PRESSED
         * REMOVE ALL SELECTED POINTS
         */
        if (cancelKeyPressed) {
            this.#drawingToolsManager.cancel();
        }

        /**
         * IF DELETE KEY IS PRESSED
         * CANCEL MID POINT INSERTION IF THERE IS ONE
         */
        if (deleteKeyPressed) {
            if (this.#midPointInsertionActive === true) {
                // remove last added point
                this.removePoint(this.#midPointInsertionIndex);
                this.#midPointInsertionActive = false;
                this.#midPointInsertionIndex = -1;
            }
        }

        /**
         * IF INSERT KEY IS PRESSED
         * ADD POINT AT RAY INTERSECTION
         */
        if (insertKeyPressed) {
            if (this.#midPointInsertionActive === true) {
                // remove last added point
                this.removePoint(this.#midPointInsertionIndex);
                this.#midPointInsertionActive = false;
                this.#midPointInsertionIndex = -1;
            }

            if(this.#insertionActiveClosed === false)
                this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;

            if (!this.#cameraFreezeFlag)
                this.#cameraFreezeFlag = this.#drawingToolsManager.viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);

            if (this.#insertionActive === false) {
                if (!this.#lastEvent) {
                    this.#alreadyInserted = false;
                    return;
                }
                // get current ray
                const ray = this.#lastEvent instanceof MouseEvent ? this.#drawingToolsManager.viewport.mouseEventToRay(this.#lastEvent) : this.#drawingToolsManager.viewport.touchEventToRay(this.#lastEvent);

                // add a point at the ray intersection
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray);
                // add at last position
                this.addPoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3, restrictedPoint);
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1, MATERIAL_INDEX.INSERTION_HOVERED);

                this.#insertionActive = true;
                this.#alreadyInserted = true;
            }
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.#drawingToolsManager.closed) return;

        const insertKeyPressed = this.#drawingToolsManager.keyPressed(event, this.#drawingToolsManager.settings.controls.insert);

        /**
         * IF INSERT KEY IS RELEASED
         * FINALIZE INSERTION OR REMOVE LAST ADDED POINT
         */
        if (insertKeyPressed) {
            this.#drawingToolsManager.viewport.removeFlag(this.#cameraFreezeFlag);
            this.#cameraFreezeFlag = '';
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;

            if (this.#insertionActive === true) {
                if(this.#insertionActiveClosed === true) {
                    this.#drawingToolsManager.geometryManager.closeLoop = false;
                    this.#insertionActiveClosed = false;
                    this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
                    this.#drawingToolsManager.geometryManager.createLineIndices(this.#drawingToolsManager.settings.geometry.close && this.#drawingToolsManager.settings.geometry.autoClose);
                } else {
                    // remove last added point
                    this.removePoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1);
                }
                this.#insertionActive = false;
                this.#alreadyInserted = false;
            }
        }
    }

    /**
     * On mouse move, move the selected point if there is one
     * 
     * @param event 
     * @param ray 
     */
    public onMove(event: MouseEvent | TouchEvent, ray: IRay): void {
        if (this.#drawingToolsManager.closed) return;
        this.#moving = true;
        this.#lastEvent = event;

        const insertKeyPressed = this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.settings.controls.insert);
        const deleteKeyPressed = this.#drawingToolsManager.keyPressed(event as MouseEvent, this.#drawingToolsManager.settings.controls.delete);

        /**
         * IF WE ARE DRAGGING A POINT
         * MOVE THE SELECTED POINTS
         */
        if (this.#selectedPointIndices.length > 0 && this.#dragging) {
            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;

            const intersectionPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, {referencePoint: this.#dragStart});

            if(intersectionPoint) {
                const difference = vec3.sub(vec3.create(), intersectionPoint, this.#dragStart);

                const selectedPoint = vec3.add(vec3.create(), difference, this.#draggedPointPosition);
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.snap(selectedPoint, { index: this.#draggedPoint });
    
                if(restrictedPoint)  {
                    const differenceToRestricted = vec3.sub(vec3.create(), restrictedPoint, this.#draggedPointPosition);
        
                    for (let i = 0; i < this.#selectedPointIndices.length; i++) {
                        // add difference to selected point
                        const selectedPoint = vec3.add(vec3.create(), differenceToRestricted, this.#selectedPointPositions[i]);
                        this.#drawingToolsManager.geometryManager.movePoint(this.#selectedPointIndices[i], selectedPoint, true);
                    }
    
                    this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
                }
            }
        }
        
        this.checkHover(event, ray);

        /**
         * IF INSERT KEY IS PRESSED
         * ADD POINT AT RAY INTERSECTION IF THERE IS NONE WAS ADDED
         * MOVE LAST ADDED POINT IF THERE IS ONE
         */
        if (insertKeyPressed) {
            if(this.#insertionActiveClosed === false) this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;

            if (this.#insertionActive === false && this.#alreadyInserted === false) {
                // add a point at the ray intersection
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray);
                // add at last position
                this.addPoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3, restrictedPoint);
                this.#drawingToolsManager.geometryManager.updateMaterialIndex(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1, MATERIAL_INDEX.INSERTION_HOVERED);

                this.#insertionActive = true;
                this.#alreadyInserted = true;
            } else if (this.#drawingToolsManager.geometryManager.positionArray.length > 0 && this.#insertionActive === true && this.#insertionActiveClosed === false) {
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, { index: this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1});
                if(restrictedPoint) {
                    this.#drawingToolsManager.geometryManager.movePoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1, restrictedPoint, false);

                    if(this.#drawingToolsManager.settings.geometry.close === true && this.#drawingToolsManager.settings.geometry.autoClose === false && this.#insertionActiveClosed === false) {
                        // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                        const firstPoint = vec3.fromValues(
                            this.#drawingToolsManager.geometryManager.positionArray.at(0)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(1)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(2)!
                        );

                        if (this.#drawingToolsManager.geometryMathManager.screenSpaceDistanceCheck(firstPoint, restrictedPoint, this.#drawingToolsManager.settings.visualization.points.size_0! * this.#drawingToolsManager.settings.visualization.distanceMultiplicationFactor).check === true) {
                            this.#drawingToolsManager.geometryManager.closeLoop = true;
                            this.removePoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1);
                            this.#insertionActiveClosed = true;
                            this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;
                        }
                    }
                }
            } else if (this.#drawingToolsManager.geometryManager.positionArray.length > 0 && this.#insertionActive === true && this.#insertionActiveClosed === true) {
                const restrictedPoint = this.#drawingToolsManager.restrictionManager.rayTrace(ray, { index: this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1});
                if(restrictedPoint) {
                    // if restricted point is close to the first point, remove the current insertion point and draw a line to the first point
                    const firstPoint = vec3.fromValues(
                        this.#drawingToolsManager.geometryManager.positionArray.at(0)!,
                        this.#drawingToolsManager.geometryManager.positionArray.at(1)!,
                        this.#drawingToolsManager.geometryManager.positionArray.at(2)!
                    );

                    if (this.#drawingToolsManager.geometryMathManager.screenSpaceDistanceCheck(firstPoint, restrictedPoint, this.#drawingToolsManager.settings.visualization.points.size_0! * this.#drawingToolsManager.settings.visualization.distanceMultiplicationFactor).check === true) {
                        this.#drawingToolsManager.geometryManager.closeLoop = false;
                        this.addPoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3, restrictedPoint);
                        this.#insertionActiveClosed = false;
                        this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
                    }
                }
            }
        }

        /**
         * IF INSERT KEY IS NOT PRESSED AND DRAGGING IS NOT ACTIVE
         * CHECK IF THERE IS A LINE CLOSE TO THE RAY AND ADD A MID POINT TO IT
         */
        if (insertKeyPressed === false && deleteKeyPressed === false && this.#dragging === false && this.#selectedPointIndices.length === 0) {
            if (this.#midPointInsertionActive === true && this.#hoveredPoint === this.#midPointInsertionIndex) {
                // we are just waiting for a mouse click to finish the mid point insertion
            } else if (this.#hoveredPoint === undefined) {
                // check if there is a line close to the ray and add a mid point to it
                const lineDistances = this.#drawingToolsManager.geometryMathManager.checkLineDistances(ray);
                if (lineDistances) {
                    let firstIndex = lineDistances[0].index[0];
                    let secondIndex = lineDistances[0].index[1];

                    if (this.#midPointInsertionActive === true && firstIndex !== this.#midPointInsertionIndex && secondIndex !== this.#midPointInsertionIndex) {
                        // remove last added point
                        this.removePoint(this.#midPointInsertionIndex);
                        this.#midPointInsertionActive = false;
                        this.#midPointInsertionIndex = -1;

                        // move indices one back if they are after the removal index
                        if (firstIndex > this.#midPointInsertionIndex) {
                            firstIndex--;

                            if (firstIndex < 0)
                                firstIndex = this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1;
                        }

                        // move indices one back if they are after the removal index
                        if (secondIndex > this.#midPointInsertionIndex) {
                            secondIndex--;

                            if (secondIndex < 0)
                                secondIndex = this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1;
                        }
                    }

                    if (this.#midPointInsertionActive === false) {
                        const firstPoint = vec3.fromValues(
                            this.#drawingToolsManager.geometryManager.positionArray.at(firstIndex * 3)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(firstIndex * 3 + 1)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(firstIndex * 3 + 2)!
                        );
                        const secondPoint = vec3.fromValues(
                            this.#drawingToolsManager.geometryManager.positionArray.at(secondIndex * 3)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(secondIndex * 3 + 1)!,
                            this.#drawingToolsManager.geometryManager.positionArray.at(secondIndex * 3 + 2)!
                        );
                        const midPoint = vec3.add(vec3.create(), firstPoint, secondPoint);
                        vec3.scale(midPoint, midPoint, 0.5);

                        this.#midPointInsertionIndex = secondIndex;

                        this.addPoint(secondIndex, midPoint);
                        this.#drawingToolsManager.geometryManager.updateMaterialIndex(secondIndex, MATERIAL_INDEX.INSERTION);

                        this.#midPointInsertionActive = true;
                    }
                } else if (this.#midPointInsertionActive === true) {
                    // remove last added point
                    this.removePoint(this.#midPointInsertionIndex);
                    this.#midPointInsertionActive = false;
                    this.#midPointInsertionIndex = -1;
                }
            } else {
                if (this.#midPointInsertionActive === true) {
                    // remove last added point
                    this.removePoint(this.#midPointInsertionIndex);
                    this.#midPointInsertionActive = false;
                    this.#midPointInsertionIndex = -1;
                }
            }
        }
    }

    /**
     * On mouse out, deselect the hovered point and remove the stop dragging
     */
    public onOut(): void {
        this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;

        // if insertion is active, remove last added point
        if (this.#insertionActive === true) {
            if(this.#insertionActiveClosed === true) {
                this.#drawingToolsManager.geometryManager.closeLoop = false;
                this.#insertionActiveClosed = false;
                this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = true;
                this.#drawingToolsManager.geometryManager.createLineIndices(this.#drawingToolsManager.settings.geometry.close && this.#drawingToolsManager.settings.geometry.autoClose);
            } else {
                // remove last added point
                this.removePoint(this.#drawingToolsManager.geometryManager.positionArray.length / 3 - 1);
            }
            this.#insertionActive = false;
            this.#alreadyInserted = false;
        }

        // reset all selected points to their original position
        this.#selectedPointIndices.forEach((element, i) => {
            this.#drawingToolsManager.geometryManager.movePoint(element, this.#selectedPointPositions[i], true);
        });

        if(this.#dragging === true) {
            // reset the dragged point position
            this.#drawingToolsManager.geometryManager.movePoint(this.#draggedPoint!, this.#draggedPointPosition, true);
        }

        // remove the hovered point and the selected points
        this.removeAllSelectedPoints();

        this.reset();
    }

    /**
     * On mouse up, check if a point is close to the ray and deselect it
     */
    public onUp(): void {
        if (this.#drawingToolsManager.closed) return;

        if (this.#justSelected === false && this.#moving === false && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.toggleSelection(this.#hoveredPoint);
        } else if (this.#justSelected === true && this.#moving === true && this.#hoveredPoint !== undefined && this.#selectedPointIndices.includes(this.#hoveredPoint)) {
            this.toggleSelection(this.#hoveredPoint);
        } if (this.#moving === true && this.#dragging === true) {
            this.removeAllSelectedPoints();
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_END, { viewportId: this.#drawingToolsManager.viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
        }

        this.reset();
    }

    /**
     * Remove all selected points
     */
    public removeAllSelectedPoints(): void {
        this.#selectedPointIndices.forEach(element => {
            this.toggleSelection(element);
        });
        this.#selectedPointIndices = [];

        this.#drawingToolsManager.geometryManager.resetMaterialIndices();
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

        this.#drawingToolsManager.geometryManager.removePoint(removalIndex);
    }

    // #endregion Public Methods (11)

    // #region Private Methods (2)

    private reset(): void {
        this.#justSelected = false;
        this.#moving = false;
        this.#dragging = false;
        this.#drawingToolsManager.restrictionManager.showRestrictionVisualization = false;
        this.#selectedPointPositions = [];
        this.#hoveredPoint = undefined;
        this.#hoveredPointPosition = vec3.create();

        this.#drawingToolsManager.viewport.removeFlag(this.#cameraFreezeFlag);
        this.#cameraFreezeFlag = '';
    }

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
            this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.SELECTED);
        } else {
            this.#selectedPointIndices.splice(indexInArray, 1);
            this.#drawingToolsManager.geometryManager.updateMaterialIndex(index, MATERIAL_INDEX.DEFAULT);
        }
    }

    // #endregion Private Methods (2)
}
