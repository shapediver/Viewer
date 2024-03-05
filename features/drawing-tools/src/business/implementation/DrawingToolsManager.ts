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
import { TextVisualizationManager } from './TextVisualizationManager';

// #region Type aliases (2)

/**
 * The geometry data of the drawing tool.
 */
export type CustomizationProperties = {
    geometry: {
        parentNode?: string; // if no node is given, the geometry is created from scratch
        mode: 'points' | 'lines'; // the mode of the geometry (default: 'lines')
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
    readonly #textVisualizationManager: TextVisualizationManager;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #closed: boolean = false;
    #continuousRenderingFlag: string = '';

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callback: (geometryData: IGeometryData) => void, customizationProperties: CustomizationProperties) {
        this.#viewport = viewport;
        this.#callback = callback;
        this.#customizationProperties = this.cleanCustomizationProperties(customizationProperties);

        this.#geometryMathManager = new GeometryMathManager(this);
        this.#restrictionManager = new RestrictionManager(this);
        this.#geometryManager = new GeometryManager(this);
        this.#interactionManager = new InteractionManager(this);
        this.#textVisualizationManager = new TextVisualizationManager(this);

        this.#eventManager = new EventManager(viewport, {
            onDown: this.#interactionManager.onDown.bind(this.#interactionManager),
            onUp: this.#interactionManager.onUp.bind(this.#interactionManager),
            onOut: this.#interactionManager.onOut.bind(this.#interactionManager),
            onMove: this.#interactionManager.onMove.bind(this.#interactionManager),
            onKeyDown: this.#interactionManager.onKeyDown.bind(this.#interactionManager),
            onKeyUp: this.#interactionManager.onKeyUp.bind(this.#interactionManager)
        });

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

    // #region Public Getters And Setters (8)

    public get callback(): (geometryData: IGeometryData) => void {
        return this.#callback;
    }

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

    public get textVisualizationManager(): TextVisualizationManager {
        return this.#textVisualizationManager;
    }

    public get viewport(): IViewportApi {
        return this.#viewport;
    }

    // #endregion Public Getters And Setters (8)

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
        this.#interactionManager.addPoint(index, position);
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
        this.#textVisualizationManager.close();

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

    // #region Private Methods (1)

    private cleanCustomizationProperties(customizationProperties: CustomizationProperties): CustomizationPropertiesDefined {

        return {
            geometry: {
                parentNode: customizationProperties.geometry?.parentNode || undefined,
                mode: customizationProperties.geometry?.mode === 'points' ? PRIMITIVE_MODE.POINTS : PRIMITIVE_MODE.LINES || PRIMITIVE_MODE.LINES,
                minPoints: customizationProperties.geometry?.minPoints || undefined,
                maxPoints: customizationProperties.geometry?.maxPoints || undefined
            },
            visualizationOptions: {
                points:
                    customizationProperties.visualizationOptions?.points ||
                    {
                        size_0: 15,
                        size_1: 20,
                        size_2: 15,
                        size_3: 20,
                        size_4: 20,
                        size_5: 20,
                        color_0: '#0d44f0',
                        color_1: '#197aeb',
                        color_2: '#9e27d8',
                        color_3: '#bc47fd',
                        color_4: '#ff0000',
                        color_5: '#00ff00',
                        sizeAttenuation_0: false,
                        sizeAttenuation_1: false,
                        sizeAttenuation_2: false,
                        sizeAttenuation_3: false,
                        sizeAttenuation_4: false,
                        sizeAttenuation_5: false
                    },
                lines:
                    customizationProperties.visualizationOptions?.lines ||
                    {
                        color: '#0d44f0'
                    }
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

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
