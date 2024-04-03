import { EventManager } from './EventManager';
import { Box, FLAG_TYPE, IBox, ITreeNode, TreeNode, sceneTree } from '@shapediver/viewer';
import { GeometryManager } from './GeometryManager';
import { GeometryMathManager } from './GeometryMathManager';
import { IMapData, IMaterialBasicLineDataProperties, IMaterialMultiPointDataProperties } from '@shapediver/viewer.shared.types';
import { IManager } from '../interfaces/IManager';
import { InteractionManager } from './InteractionManager';
import { IViewportApi } from '@shapediver/viewer.features.interaction';
import { RESTRICTION_TYPE, RestrictionProperties } from '../interfaces/IRestriction';
import { RestrictionManager } from './RestrictionManager';
import { TextVisualizationManager } from './TextVisualizationManager';
import { EVENTTYPE_DRAWING_TOOLS, EventEngine, ShapeDiverViewerDrawingToolsError, UuidGenerator } from '@shapediver/viewer.shared.services';
import { vec3 } from 'gl-matrix';
import { PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';

// #region Type aliases (6)

/**
 * The data of the points.
 * The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point.
 * 
 * @example [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
 * @typedef PointsData
 */
export type PointsData = number[][];

/**
 * The callbacks of the drawing tool.
 * 
 * Here you can define the callbacks that are used when interacting with the drawing tool.
 * 
 * @typedef Callbacks
 */
export type Callbacks = {
    /**
     * The callback that is called when the drawing tool is cancelled.
     */
    onCancel(): void;
    /**
     * The callback that is called when the drawing tool is finished.
     * 
     * @param pointsData The points data of the drawing tool.
     */
    onFinish(pointsData: PointsData): void;
    /**
     * The callback that is called when the drawing tool is updated.
     * 
     * @param pointsData The points data of the drawing tool.
     */
    onUpdate(pointsData: PointsData): void;
};

/**
 * The initial settings of the drawing tool.
 * Here you can define the initial settings of the drawing tool.
 * 
 * @typedef Settings
 * 
 */
export type Settings = {
    /**
     * The geometry settings of the drawing tool.
     * 
     * Here you can define the points, the mode and specific details of the geometry.
     */
    geometry: {
        
        /**
         * The points that are used when starting the drawing tool.
         * The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point.
         *  
         * If the mode is set to 'lines', the points are connected in the order they are defined.
         * If the mode is set to 'points', the points are not connected.
         * 
         * @default []
         * @example [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
         */
        points: PointsData;

        /**
         * The mode of the geometry.
         * 
         * If the mode is set to 'lines', the points are connected in the order they are defined.
         * If the mode is set to 'points', the points are not connected.
         * 
         * @default 'lines'
         */
        mode: 'points' | 'lines';

        /**
         * The minimum amount of points, if undefined, the geometry is not restricted.
         * This value is checked whenever the user tries to update or finish the drawing tool.
         * 
         * @default undefined
         */
        minPoints?: number;

        /**
         * The maximum amount of points, if undefined, the geometry is not restricted.
         * This value is checked whenever the user tries to update or finish the drawing tool.
         * 
         * @default undefined
         */
        maxPoints?: number;

        /**
         * If the mode is set to 'lines', if it is a closed line or not.
         * If the mode is set to 'points', this setting is ignored.
         * 
         * A line can be closed by connecting the last point with the first point.
         * 
         * @default true
         */
        close: boolean;

        /**
         * If the mode is set to 'lines', if the line is automatically closed.
         * If the mode is set to 'points', this setting is ignored.
         * 
         * The first and last point are always connected if the line is automatically closed.
         * 
         * @default true
         */
        autoClose: boolean;

    },
    
    /**
     * The restrictions of the drawing tool.
     * 
     * Here you can define the restrictions that are used when interacting with the drawing tool.
     * At least one restriction is required, the plane restriction is added by default if no restrictions are defined.
     * 
     * At the moment, only the plane restriction is supported.
     */
    restrictions: { [key: string]: RestrictionProperties | PlaneRestrictionProperties};

    /**
     * The visualization settings of the drawing tool.
     * 
     * Here you can define the visualization of the drawing tool.
     */
    visualization: {

        /**
         * The multiplication factor of the point size when interactions are performed.
         * If the factor is set to 2, the point size is doubled when interacting.
         * 
         * @default 2
         */
        distanceMultiplicationFactor: number,

        /**
         * If the point labels are shown.
         * The point labels display the position of the points.
         * 
         * @default false
         */
        pointLabels: boolean,

        /**
         * If the distance labels are shown.
         * The distance labels display the distance between the points.
         * 
         * @default true
         */
        distanceLabels: boolean,

        /**
         * The material properties of the points.
         */
        points: IMaterialMultiPointDataProperties,

        /**
         * The material properties of the lines.
         */
        lines: IMaterialBasicLineDataProperties

    };

    /**
     * The control settings of the drawing tool.
     * 
     * Here you can define which keys are used for the different actions of the drawing tool.
     */
    controls: {

        /**
         * The key that is used to insert a point.
         * 
         * @default 'Ctrl'
         */
        insert: string, 
        
        /**
         * The key that is used to delete a point.
         * 
         * @default 'Shift'
         */
        delete: string,

        /**
         * The key that is used to finish drawing.
         * 
         * @default 'Enter'
         */
        finish: string,

        /**
         * The key that is used to update drawing.
         * 
         * @default 'Space'
         */
        update: string,

        /**
         * The key that is used to cancel drawing.
         * 
         * @default 'Escape'
         */
        cancel: string, // cancel drawing (default: Escape)
    };
    
};

export type SettingsOptional = {
    geometry?: Partial<Settings['geometry']>;
    restrictions?: Partial<Settings['restrictions']>;
    visualization?: Partial<Settings['visualization']>;
    controls?: Partial<Settings['controls']>;
};

export type DefaultTextures = { [key: string]: Promise<IMapData> | IMapData }

// #endregion Type aliases (6)

// #region Classes (1)

export class DrawingToolsManager implements IManager {
    // #region Properties (17)

    readonly #callbacks: Callbacks;
    readonly #settings: Settings;
    readonly #defaultTextures: DefaultTextures;
    readonly #eventEngine = EventEngine.instance;
    readonly #eventManager: EventManager;
    readonly #geometryManager: GeometryManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #interactionManager: InteractionManager;
    readonly #parentNode: ITreeNode;
    readonly #restrictionManager: RestrictionManager;
    readonly #textVisualizationManager: TextVisualizationManager;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #closed: boolean = false;
    #continuousRenderingFlag: string = '';
    #inputBoundingBox: IBox = new Box();
    #uuid = this.#uuidGenerator.create();

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks, settings: SettingsOptional, defaultTextures?: DefaultTextures) {
        this.#viewport = viewport;
        this.#callbacks = callbacks;
        this.#settings = this.cleanSettings(settings);
        this.#defaultTextures = defaultTextures!;

        this.#parentNode = new TreeNode(`DrawingToolsManager_${this.#uuid}`);
        sceneTree.root.addChild(this.#parentNode);
        sceneTree.root.updateVersion(false, false);

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

    // #region Public Getters And Setters (13)

    public get callbacks(): Callbacks {
        return this.#callbacks;
    }

    public get closed(): boolean {
        return this.#closed;
    }

    public get settings(): Settings {
        return this.#settings;
    }

    public get defaultTextures(): DefaultTextures {
        return this.#defaultTextures;
    }

    public get geometryManager(): GeometryManager {
        return this.#geometryManager;
    }

    public get geometryMathManager(): GeometryMathManager {
        return this.#geometryMathManager;
    }

    public get inputBoundingBox(): IBox {
        return this.#inputBoundingBox;
    }

    public get interactionManager(): InteractionManager {
        return this.#interactionManager;
    }

    public get parentNode(): ITreeNode {
        return this.#parentNode;
    }

    public get restrictionManager(): RestrictionManager {
        return this.#restrictionManager;
    }

    public get textVisualizationManager(): TextVisualizationManager {
        return this.#textVisualizationManager;
    }

    public get uuid(): string {
        return this.#uuid;
    }

    public get viewport(): IViewportApi {
        return this.#viewport;
    }

    // #endregion Public Getters And Setters (13)

    // #region Public Methods (9)

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
    public addRestriction(properties: RestrictionProperties, token?: string): string | undefined {
        return this.#restrictionManager.addRestriction(properties, token);
    }

    public cancel(): void {
        if (this.#closed) return;
        try {
            this.#callbacks.onCancel();
        } catch (e) {
            throw new ShapeDiverViewerDrawingToolsError('An error occurred while cancelling the drawing tool.');
        }
        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.CANCEL, { viewportId: this.viewport.id, drawingToolsId: this.#uuid });
        this.close();
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

        sceneTree.root.removeChild(this.#parentNode);
        sceneTree.root.updateVersion(false, false);
        this.#closed = true;
    }

    public finish(): PointsData | undefined {
        if (this.#closed) return;
        const pointsData = this.#geometryManager.getPointsData();
        try {
            this.#callbacks.onFinish(pointsData);
        } catch (e) {
            throw new ShapeDiverViewerDrawingToolsError('An error occurred while finishing the drawing tool.');
        }
        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.FINISH, { viewportId: this.viewport.id, drawingToolsId: this.#uuid });
        this.close();
        return pointsData;
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
                return event.code === key;
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

    public update(): PointsData | undefined {
        if (this.#closed) return;
        const pointsData = this.#geometryManager.getPointsData();
        try{
            this.#callbacks.onUpdate(pointsData);
        } catch (e) {
            throw new ShapeDiverViewerDrawingToolsError('An error occurred while updating the drawing tool.');
        }
        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.UPDATE, { viewportId: this.viewport.id, drawingToolsId: this.#uuid });
        return pointsData;
    }

    // #endregion Public Methods (9)

    // #region Private Methods (1)

    private cleanSettings(settingsOptional: SettingsOptional): Settings {
        if(typeof settingsOptional === 'string') settingsOptional = JSON.parse(settingsOptional);

        const settings: Settings = {
            geometry: {
                points: [],
                mode: 'lines',
                close: true,
                autoClose: false
            },
            restrictions: {},
            visualization: {
                distanceMultiplicationFactor: settingsOptional.visualization?.distanceMultiplicationFactor === undefined ? 2 : settingsOptional.visualization.distanceMultiplicationFactor,
                pointLabels: settingsOptional.visualization?.pointLabels === undefined ? false : settingsOptional.visualization.pointLabels,
                distanceLabels: settingsOptional.visualization?.distanceLabels === undefined ? true : settingsOptional.visualization.distanceLabels,
                points: settingsOptional.visualization?.points === undefined ? {
                    size_0: 15, size_1: 20, size_2: 15, size_3: 20, size_4: 20, size_5: 15, size_6: 20,
                    color_0: '#0d44f0', color_1: '#197aeb', color_2: '#9e27d8', color_3: '#bc47fd', color_4: '#ff2854', color_5: '#00ff78', color_6: '#00ff78'
                } : settingsOptional.visualization.points,
                lines: settingsOptional.visualization?.lines === undefined ? {
                    color: '#0d44f0'
                } : settingsOptional.visualization.lines
            },
            controls: {
                insert: settingsOptional.controls?.insert === undefined ? 'Ctrl' : settingsOptional.controls.insert,
                delete: settingsOptional.controls?.delete === undefined ? 'Shift' : settingsOptional.controls.delete,
                finish: settingsOptional.controls?.finish === undefined ? 'Enter' : settingsOptional.controls.finish,
                cancel: settingsOptional.controls?.cancel === undefined ? 'Escape' : settingsOptional.controls.cancel,
                update: settingsOptional.controls?.update === undefined ? 'Space' : settingsOptional.controls.update
            }
        };

        if (settingsOptional.geometry !== undefined) {
            settings.geometry = {
                points: settingsOptional.geometry.points === undefined ? [] : settingsOptional.geometry.points,
                mode: settingsOptional.geometry.mode === 'points' ? 'points' : 'lines',
                minPoints: settingsOptional.geometry.minPoints,
                maxPoints: settingsOptional.geometry.maxPoints,
                close: settingsOptional.geometry.close === undefined ? true : settingsOptional.geometry.close,
                autoClose: settingsOptional.geometry.autoClose === undefined ? true : settingsOptional.geometry.autoClose
            };
        }

        const min = vec3.fromValues(Infinity, Infinity, Infinity);
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
        for(let i = 0; i < settings.geometry.points.length; i++) {
            const point = settings.geometry.points[i];
            
            min[0] = Math.min(min[0], point[0]);
            min[1] = Math.min(min[1], point[1]);
            min[2] = Math.min(min[2], point[2]);

            max[0] = Math.max(max[0], point[0]);
            max[1] = Math.max(max[1], point[1]);
            max[2] = Math.max(max[2], point[2]);
        }
        this.#inputBoundingBox = new Box(min, max);

        if (settingsOptional.restrictions === undefined || Object.keys(settingsOptional.restrictions).length === 0) {
            settings.restrictions['plane'] = { type: RESTRICTION_TYPE.PLANE };
        } else {
            settings.restrictions = settingsOptional.restrictions as { [key: string]: RestrictionProperties };
        }

        return settings;
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)
