import { EventManager } from './EventManager';
import { FLAG_TYPE, sceneTree } from '@shapediver/viewer';
import { GeometryManager } from './GeometryManager';
import { GeometryMathManager } from './GeometryMathManager';
import { IGeometryData, IMaterialBasicLineDataProperties, IMaterialMultiPointDataProperties } from '@shapediver/viewer.shared.types';
import { IManager } from '../interfaces/IManager';
import { InteractionManager } from './InteractionManager';
import { IViewportApi } from '@shapediver/viewer.features.interaction';
import { RESTRICTION_TYPE, RestrictionProperties } from '../interfaces/IRestriction';
import { RestrictionManager } from './RestrictionManager';
import { TextVisualizationManager } from './TextVisualizationManager';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
import { vec3 } from 'gl-matrix';

// #region Type aliases (5)

export type Callbacks = {
    onCancel(): void;
    onFinish(geometryData: IGeometryData): void;
};
/**
 * The customization properties of the drawing tool.
 */
export type CustomizationProperties = {
    geometry: {
        parentNode?: string; // if no node is given, the geometry is created from scratch
        mode: 'points' | 'lines'; // the mode of the geometry (default: 'lines')
        minPoints?: number; // the minimum amount of points, if undefined, the geometry is not restricted (default: undefined)
        maxPoints?: number; // the maximum amount of points, if undefined, the geometry is not restricted (default: undefined),
        close: boolean; // if the geometry is closed (default: true)
        autoClose: boolean; // if the geometry is automatically closed (default: true)
        origin: vec3, // the origin of the drawing tool (default: vec3.fromValues(0, 0, 0))
    },
    restrictions: RestrictionProperties[] // the restrictions of the drawing tool
    
};
export type CustomizationPropertiesOptional = {
    geometry?: Partial<CustomizationProperties['geometry']>;
    restrictions?: Partial<CustomizationProperties['restrictions']>;
};
/**
 * The setup properties of the drawing tool.
 */
export type SetupProperties = {
    visualization: {
        distanceMultiplicationFactor: number, // the multiplication factor of the point size when interacting with the drawing tool (default: 2)
        pointLabels: boolean, // show the point labels of the drawing tool (default: false)
        distanceLabels: boolean, // show the distance labels of the drawing tool (default: false)
        points: IMaterialMultiPointDataProperties, // the material properties of the points
        lines: IMaterialBasicLineDataProperties // the material properties of the lines
    },
    controls: {
        insert: string, // insert point, can only be a modifier key (Ctrl, Shift, Alt) (default: Ctrl)
        delete: string, // delete point, can only be a modifier key (Ctrl, Shift, Alt) (default: Shift)
        finish: string, // finish drawing (default: Enter)
        cancel: string, // cancel drawing (default: Escape)
    }
};
export type SetupPropertiesOptional = {
    visualization?: Partial<SetupProperties['visualization']>;
    controls?: Partial<SetupProperties['controls']>;
};

// #endregion Type aliases (5)

// #region Classes (1)

export class DrawingToolsManager implements IManager {
    // #region Properties (13)

    readonly #callbacks: Callbacks;
    readonly #customizationProperties: CustomizationProperties;
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
    #setupProperties: SetupProperties;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, customizationProperties: CustomizationPropertiesOptional, setupProperties?: SetupPropertiesOptional) {
        this.#viewport = viewport;
        this.#callbacks = callbacks;
        [this.#customizationProperties, this.#setupProperties] = this.cleanProperties(customizationProperties, setupProperties);

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

        this.#continuousRenderingFlag = this.#viewport.addFlag(FLAG_TYPE.CONTINUOUS_RENDERING);

        // special case, the scene is still empty, so we create a grid by default and show the scene
        if (sceneTree.root.boundingBox.isEmpty())
            this.#viewport.show = true;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (10)

    public get callbacks(): Callbacks {
        return this.#callbacks;
    }

    public get closed(): boolean {
        return this.#closed;
    }

    public get customizationProperties(): CustomizationProperties {
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

    public get setupProperties(): SetupProperties {
        return this.#setupProperties;
    }

    public get textVisualizationManager(): TextVisualizationManager {
        return this.#textVisualizationManager;
    }

    public get viewport(): IViewportApi {
        return this.#viewport;
    }

    // #endregion Public Getters And Setters (10)

    // #region Public Methods (6)

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
     * Add a ray tracing intersection restriction to the drawing tool.
     * 
     * @param planeProperties 
     * @returns 
     */
    public addRestriction(properties: RestrictionProperties): string | undefined {
        return this.#restrictionManager.addRestriction(properties);
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

    // #endregion Public Methods (6)

    // #region Private Methods (1)

    private cleanProperties(customizationPropertiesOptional: CustomizationPropertiesOptional, setupPropertiesOptional?: SetupPropertiesOptional): [CustomizationProperties, SetupProperties] {
        if(typeof customizationPropertiesOptional === 'string') customizationPropertiesOptional = JSON.parse(customizationPropertiesOptional);
        if(typeof setupPropertiesOptional === 'string') setupPropertiesOptional = JSON.parse(setupPropertiesOptional);

        const customizationProperties: CustomizationProperties = {
            geometry: {
                mode: 'lines',
                close: true,
                autoClose: false,
                origin: vec3.fromValues(0, 0, 0)
            },
            restrictions: []
        };

        if (customizationPropertiesOptional.geometry !== undefined) {
            customizationProperties.geometry = {
                parentNode: customizationPropertiesOptional.geometry.parentNode,
                mode: customizationPropertiesOptional.geometry.mode === 'points' ? 'points' : 'lines',
                minPoints: customizationPropertiesOptional.geometry.minPoints,
                maxPoints: customizationPropertiesOptional.geometry.maxPoints,
                close: customizationPropertiesOptional.geometry.close === undefined ? true : customizationPropertiesOptional.geometry.close,
                autoClose: customizationPropertiesOptional.geometry.autoClose === undefined ? true : customizationPropertiesOptional.geometry.autoClose,
                origin: customizationPropertiesOptional.geometry.origin === undefined ? vec3.fromValues(0, 0, 0) : customizationPropertiesOptional.geometry.origin
            };
        }

        if (customizationPropertiesOptional.restrictions === undefined || customizationPropertiesOptional.restrictions.length === 0) {
            customizationProperties.restrictions = [
                {
                    type: RESTRICTION_TYPE.PLANE,
                    enabled: true,
                    showVisualization: true
                }
            ];
        } else {
            customizationProperties.restrictions = customizationPropertiesOptional.restrictions as RestrictionProperties[];
        }

        const setupProperties: SetupProperties = {
            visualization: {
                distanceMultiplicationFactor: setupPropertiesOptional?.visualization?.distanceMultiplicationFactor === undefined ? 2 : setupPropertiesOptional.visualization.distanceMultiplicationFactor,
                pointLabels: setupPropertiesOptional?.visualization?.pointLabels === undefined ? false : setupPropertiesOptional.visualization.pointLabels,
                distanceLabels: setupPropertiesOptional?.visualization?.distanceLabels === undefined ? true : setupPropertiesOptional.visualization.distanceLabels,
                points: setupPropertiesOptional?.visualization?.points === undefined ? {
                    size_0: 15, size_1: 20, size_2: 15, size_3: 20, size_4: 20, size_5: 15, size_6: 20,
                    color_0: '#0d44f0', color_1: '#197aeb', color_2: '#9e27d8', color_3: '#bc47fd', color_4: '#ff2854', color_5: '#00ff78', color_6: '#00ff78'
                } : setupPropertiesOptional.visualization.points,
                lines: setupPropertiesOptional?.visualization?.lines === undefined ? {
                    color: '#0d44f0'
                } : setupPropertiesOptional.visualization.lines
            },
            controls: {
                insert: setupPropertiesOptional?.controls?.insert === undefined ? 'Ctrl' : setupPropertiesOptional.controls.insert,
                delete: setupPropertiesOptional?.controls?.delete === undefined ? 'Shift' : setupPropertiesOptional.controls.delete,
                finish: setupPropertiesOptional?.controls?.finish === undefined ? 'Enter' : setupPropertiesOptional.controls.finish,
                cancel: setupPropertiesOptional?.controls?.cancel === undefined ? 'Escape' : setupPropertiesOptional.controls.cancel
            }
        };

        return [customizationProperties, setupProperties];
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
