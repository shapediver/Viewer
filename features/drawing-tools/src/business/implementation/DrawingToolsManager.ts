import { AngularRestriction, AngularRestrictionProperties } from './restrictions/snap/AngularRestriction';
import { EventManager } from './EventManager';
import { FLAG_TYPE, sceneTree } from '@shapediver/viewer';
import { GeometryManager } from './GeometryManager';
import { GeometryMathManager } from './GeometryMathManager';
import { GridRestriction, GridRestrictionProperties } from './restrictions/snap/GridRestriction';
import {
    IGeometryData,
    IMaterialBasicLineDataProperties,
    IMaterialMultiPointDataProperties,
    PRIMITIVE_MODE
} from '@shapediver/viewer.shared.types';
import { IManager } from '../interfaces/IManager';
import { InteractionManager } from './InteractionManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';
import { IRestriction } from '../interfaces/IRestriction';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/intersection/PlaneRestriction';
import { RestrictionManager } from './RestrictionManager';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
import { vec3 } from 'gl-matrix';

// #region Type aliases (2)

/**
 * The geometry data of the drawing tool.
 */
export type CustomizationProperties = {
    geometry: {
        parentNode?: string; // if no node is given, the geometry is created from scratch
        mode: PRIMITIVE_MODE; // the mode of the geometry (default: PRIMITIVE_MODE.LINES)
        minPoints?: number; // the minimum amount of points, if undefined, the geometry is not restricted (default: undefined)
        maxPoints?: number; // the maximum amount of points, if undefined, the geometry is not restricted (default: undefined)
    },
    visualizationOptions?: {
        points?: IMaterialMultiPointDataProperties, // the visualization options for points
        lines?: IMaterialBasicLineDataProperties, // the visualization options for lines
    },
    restrictions?: {
        plane?: PlaneRestrictionProperties, // the properties of the plane intersection restriction
        grid?: GridRestrictionProperties, // the properties of the grid snapping restriction
        angular?: AngularRestrictionProperties, // the properties of the angular snapping restriction
    },
    controls?: {
        insert?: string, // insert point, can only be a modifier key (Ctrl, Shift, Alt) (default: Ctrl)
        delete?: string, // delete point, can only be a modifier key (Ctrl, Shift, Alt) (default: Shift)
        finish?: string, // finish drawing (default: Enter)
        cancel?: string, // cancel drawing (default: Escape)
    }
};
type CustomizationPropertiesDefined = {
    geometry: {
        parentNode?: string; // if no node is given, the geometry is created from scratch
        mode: PRIMITIVE_MODE; // the mode of the geometry (default: PRIMITIVE_MODE.LINES)
        minPoints?: number; // the minimum amount of points, if undefined, the geometry is not restricted (default: undefined)
        maxPoints?: number; // the maximum amount of points, if undefined, the geometry is not restricted (default: undefined)
    },
    visualizationOptions: {
        points: IMaterialMultiPointDataProperties, // the visualization options for points
        lines: IMaterialBasicLineDataProperties, // the visualization options for lines
    },
    restrictions: {
        plane?: PlaneRestrictionProperties, // the properties of the plane intersection restriction
        grid?: GridRestrictionProperties, // the properties of the grid snapping restriction
        angular?: AngularRestrictionProperties, // the properties of the angular snapping restriction
    },
    controls: {
        insert: string, // insert point, can only be a modifier key (Ctrl, Shift, Alt) (default: Ctrl)
        delete: string, // delete point, can only be a modifier key (Ctrl, Shift, Alt) (default: Shift)
        finish: string, // finish drawing (default: Enter)
        cancel: string, // cancel drawing (default: Escape)
    }
};

// #endregion Type aliases (2)

// #region Classes (1)

export class DrawingToolsManager implements IManager {
    // #region Properties (12)

    readonly #callback: (geometryData: IGeometryData) => void;
    readonly #customizationProperties: CustomizationPropertiesDefined;
    readonly #eventManager: EventManager;
    readonly #geometryManager: GeometryManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #interactionManager: InteractionManager;
    readonly #restrictionManager: RestrictionManager;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #cameraFreezeFlag: string = '';
    #closed: boolean = false;
    #continuousRenderingFlag: string = '';

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callback: (geometryData: IGeometryData) => void, customizationProperties: CustomizationProperties) {
        this.#viewport = viewport;
        this.#callback = callback;
        this.#customizationProperties = this.cleanCustomizationProperties(customizationProperties);

        this.#eventManager = new EventManager(viewport, {
            onDown: this.onDown.bind(this),
            onEnd: this.onEnd.bind(this),
            onMove: this.onMove.bind(this),
            onKeyDown: this.onKeyDown.bind(this),
            onKeyUp: this.onKeyUp.bind(this)
        });

        this.#geometryMathManager = new GeometryMathManager(this);
        this.#restrictionManager = new RestrictionManager(this);
        this.#geometryManager = new GeometryManager(this);
        this.#interactionManager = new InteractionManager(this);

        if (this.#customizationProperties.restrictions.grid)
            this.addGridSnappingRestriction(this.#customizationProperties.restrictions.grid);

        if (this.#customizationProperties.restrictions.plane)
            this.addPlaneIntersectionRestriction(this.#customizationProperties.restrictions.plane);

        if (this.#customizationProperties.restrictions.angular)
            this.addAngularSnappingRestriction(this.#customizationProperties.restrictions.angular);

        this.#continuousRenderingFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);

        // special case, the scene is still empty, so we create a grid by default and show the scene
        if (sceneTree.root.boundingBox.isEmpty())
            this.#viewport.show = true;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (7)

    public get closed(): boolean {
        return this.#closed;
    }

    public get customizationProperties(): CustomizationPropertiesDefined {
        return this.#customizationProperties;
    }

    public get geometryManager(): GeometryManager {
        return this.#geometryManager;
    }

    public get geometryMathManager(): GeometryMathManager {
        return this.#geometryMathManager;
    }

    public get interactionManager(): InteractionManager {
        return this.#interactionManager;
    }

    public get restrictionManager(): RestrictionManager {
        return this.#restrictionManager;
    }

    public get viewport(): IViewportApi {
        return this.#viewport;
    }

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (9)

    /**
     * Add a angular snapping restriction to the drawing tool.
     * 
     * @param angularProperties 
     * @returns 
     */
    public addAngularSnappingRestriction(angularProperties: AngularRestrictionProperties): string {
        const token = this.#uuidGenerator.create();
        this.#restrictionManager.addRestriction(new AngularRestriction(this, token, angularProperties), token);
        return token;
    }

    /**
     * Add a grid snapping restriction to the drawing tool.
     * 
     * @param gridProperties 
     * @returns 
     */
    public addGridSnappingRestriction(gridProperties: GridRestrictionProperties): string {
        const token = this.#uuidGenerator.create();
        this.#restrictionManager.addRestriction(new GridRestriction(this, token, gridProperties), token);
        return token;
    }

    /**
     * Add a plane intersection restriction to the drawing tool.
     * 
     * @param planeProperties 
     * @returns 
     */
    public addPlaneIntersectionRestriction(planeProperties: PlaneRestrictionProperties): string {
        const token = this.#uuidGenerator.create();
        this.#restrictionManager.addRestriction(new PlaneRestriction(this, token, planeProperties), token);
        return token;
    }

    /**
     * Add a point to the drawing tool.
     * 
     * @param index 
     * @param position 
     * @returns 
     */
    public addPoint(index: number, position?: vec3 | undefined): void {
        if (this.#closed) return;
        console.log('addPoint', index, position);
        this.#geometryManager.addPoint(index, position);
        this.#interactionManager.addPoint(index);
    }

    /**
     * Add a restriction to the drawing tool.
     * 
     * @param restriction 
     * @param token 
     */
    public addRestriction(restriction: IRestriction, token: string): void {
        this.#restrictionManager.addRestriction(restriction, token);
    }

    public close(): void {
        if (this.#closed) return;
        this.#viewport.removeFlag(this.#continuousRenderingFlag);
        this.#eventManager.close();
        this.#geometryMathManager.close();
        this.#restrictionManager.close();
        this.#geometryManager.close();
        this.#interactionManager.close();

        this.#closed = true;
    }

    public keyPressed(event: MouseEvent | KeyboardEvent, key: string): boolean {
        if (event instanceof MouseEvent) {
            if (key === 'Ctrl') {
                return event.ctrlKey;
            } else if (key === 'Shift') {
                return event.shiftKey;
            } else if (key === 'Alt') {
                return event.altKey;
            }
        } else if (event instanceof KeyboardEvent) {
            if (key === 'Ctrl') {
                return event.key === 'Control' || event.ctrlKey;
            } else if (key === 'Shift') {
                return event.key === 'Shift' || event.shiftKey;
            } else if (key === 'Alt') {
                return event.key === 'Alt' || event.altKey;
            } else {
                return event.key === key;
            }
        }
        return false;
    }

    /**
     * Remove a point from the drawing tool.
     * 
     * @param index 
     * @returns 
     */
    public removePoint(index: number): void {
        if (this.#closed) return;
        this.#interactionManager.removePoint(index);
        this.#geometryManager.removePoint(index);
    }

    /**
     * Remove a restriction from the drawing tool.
     * 
     * @param token 
     */
    public removeRestriction(token: string): void {
        this.#restrictionManager.removeRestriction(token);
    }

    // #endregion Public Methods (9)

    // #region Private Methods (6)

    private cleanCustomizationProperties(customizationProperties: CustomizationProperties): CustomizationPropertiesDefined {
        return {
            geometry: customizationProperties.geometry,
            visualizationOptions: {
                points: customizationProperties.visualizationOptions?.points || {},
                lines: customizationProperties.visualizationOptions?.lines || {}
            },
            controls: {
                insert: customizationProperties.controls?.insert || 'Ctrl',
                delete: customizationProperties.controls?.delete || 'Shift',
                finish: customizationProperties.controls?.finish || 'Enter',
                cancel: customizationProperties.controls?.cancel || 'Escape'
            },
            restrictions: {
                plane:
                    customizationProperties.restrictions?.plane ?
                        {
                            gridSize: customizationProperties.restrictions?.grid?.gridSize || 100,
                            normal: customizationProperties.restrictions?.plane?.normal || vec3.fromValues(0, 0, 1),
                            origin: customizationProperties.restrictions?.plane?.origin || vec3.fromValues(0, 0, 0)
                        } : undefined,
                grid:
                    customizationProperties.restrictions?.grid ?
                        {
                            gridUnit: customizationProperties.restrictions?.grid?.gridUnit || 1,
                            gridSize: customizationProperties.restrictions?.grid?.gridSize || 100,
                            normal: customizationProperties.restrictions?.plane?.normal || vec3.fromValues(0, 0, 1),
                            origin: customizationProperties.restrictions?.plane?.origin || vec3.fromValues(0, 0, 0)
                        } : undefined,
                angular:
                    customizationProperties.restrictions?.angular ?
                        {
                            angleStep: customizationProperties.restrictions?.angular?.angleStep || Math.PI / 8,
                            normal: customizationProperties.restrictions?.plane?.normal || vec3.fromValues(0, 0, 1)
                        } : undefined,
            }
        };
    }

    /**
     * Apply all filters for the intersection of the scene.
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onDown(event: MouseEvent | TouchEvent, ray: IRay): void {
        if (this.#closed) return;

        if (this.#geometryManager.onDown(event, ray)) {
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        } else if (this.#interactionManager.onDown(event, ray)) {
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        }
        this.#interactionManager.checkHover(event, ray);
    }

    /**
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onEnd(): void {
        if (this.#closed) return;
        this.#interactionManager.onEnd();
        this.#viewport.removeFlag(this.#cameraFreezeFlag);
        this.#cameraFreezeFlag = '';
    }

    /**
     * On key down event, remove all selected points if escape is pressed.
     * 
     * @param event 
     */
    private onKeyDown(event: KeyboardEvent): void {
        // if escape is pressed, remove all selected points
        if (this.keyPressed(event, this.#customizationProperties.controls.cancel)) {
            this.#interactionManager.removeAllSelectedPoints();
        }

        // if enter is pressed, finish the drawing
        if (this.keyPressed(event, this.#customizationProperties.controls.finish)) {
            this.#callback(this.#geometryManager.geometryData);
            this.close();
        }

        // if shift is pressed, remove the camera freeze flag
        if (this.keyPressed(event, this.#customizationProperties.controls.insert) && !this.#cameraFreezeFlag) {
            this.#cameraFreezeFlag = this.#viewport.addFlag(FLAG_TYPE.CAMERA_FREEZE);
        }

        this.#geometryManager.onKeyDown(event);
        this.#viewport.update();
    }

    /**
     * On key up event, remove the camera freeze flag if control is released.
     * 
     * @param event 
     */
    private onKeyUp(event: KeyboardEvent): void {
        if (this.keyPressed(event, this.#customizationProperties.controls.insert)) {
            this.#viewport.removeFlag(this.#cameraFreezeFlag);
            this.#cameraFreezeFlag = '';
        }

        this.#geometryManager.onKeyUp(event);
    }

    /**
     * Call all according interaction managers with the results.
     * 
     * @param ray 
     */
    private onMove(event: MouseEvent | TouchEvent, ray: IRay): void {
        if (this.#closed) return;
        this.#interactionManager.onMove(event, ray);
        this.#geometryManager.onMove(event, ray);
    }

    // #endregion Private Methods (6)
}

// #endregion Classes (1)
