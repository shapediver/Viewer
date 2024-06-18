import { AxisRestrictionProperties } from '../implementation/managers/interaction/restrictions/axis/AxisRestriction';
import { GeometryRestrictionProperties } from '../implementation/managers/interaction/restrictions/geometry/GeometryRestriction';
import { IManager } from './IManager';
import { IMapData, IMaterialBasicLineDataProperties, IMaterialMultiPointDataProperties } from '@shapediver/viewer.shared.types';
import { IRestriction, RestrictionProperties } from './IRestriction';
import { PlaneRestrictionProperties } from '../implementation/managers/interaction/restrictions/plane/PlaneRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (5)

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
     * The callback that is called when the drawing tool is updated.
     * 
     * @param pointsData The points data of the drawing tool.
     */
    onUpdate(pointsData: PointsData): void;
};
export type DefaultTextures = { [key: string]: Promise<IMapData> | IMapData }

/**
 * The data of the points.
 * The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point.
 * 
 * @example [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]
 * @typedef PointsData
 */
export type PointsData = number[][];
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
         * If the number of points is strictly checked during the drawing process.
         * If this setting is set to true, once the minimum or maximum amount of points is reached, the user cannot add or remove points that would violate the restriction.
         * If this setting is set to false, the user can add or remove points even if the minimum or maximum amount of points is exceeded temporarily.
         * Once the user tries to update or finish the drawing tool, the amount of points is checked in either case.
         * 
         * @default true
         */
        strictMinMaxPoints?: boolean;

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
     * At least one restriction is required, the plane and axis restrictions are added by default if no restrictions are defined.
     */
    restrictions: { [key: string]: RestrictionProperties | PlaneRestrictionProperties | GeometryRestrictionProperties | AxisRestrictionProperties };

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
         * @default ['Insert','+']
         */
        insert: string | string[],

        /**
         * The key that is used to delete a point.
         * 
         * @default ['Delete','-']
         */
        delete: string | string[],

        /**
         * The key that is used to confirm actions.
         * 
         * @default 'Enter'
         */
        confirm: string | string[],

        /**
         * The key that is used to cancel drawing.
         * 
         * @default 'Escape'
         */
        cancel: string | string[],

        /**
         * The keys that are used to undo the last action.
         * 
         * @default 'Control+Z'
         */
        undo: string | string[],

        /**
         * The keys that are used to redo the last action.
         * 
         * @default 'Control+Y'
         */
        redo: string | string[]
    };

    /**
     * The general settings of the drawing tool.
     * 
     * Here you can define general settings of the drawing tool.
     */
    general: {
        /**
         * If the drawing tool is started automatically when no points are defined.
         * 
         * @default true
         */
        autoStart: boolean;

        /**
         * If the drawing tool is updated automatically when the drawing is changed.
         * 
         * @default false
         */
        autoUpdate: boolean;
        /**
         * If the drawing tool is closed when the drawing is updated.
         * 
         * @default false
         */
        closeOnUpdate: boolean;

        /** 
         * The unit that will be displayed in the distance and point labels. 
         * 
         * @default ''
         */
        displayUnit: string;
    }

};
export type SettingsOptional = {
    geometry?: Partial<Settings['geometry']>;
    restrictions?: Partial<Settings['restrictions']>;
    visualization?: Partial<Settings['visualization']>;
    controls?: Partial<Settings['controls']>;
    general?: Partial<Settings['general']>;
};

// #endregion Type aliases (5)

// #region Interfaces (1)

export interface IDrawingToolsManager extends IManager {
    // #region Properties (4)

    readonly closed: boolean;
    readonly restrictions: { [key: string]: IRestriction };

    showDistanceLabels: boolean;
    showPointLabels: boolean;

    // #endregion Properties (4)

    // #region Public Methods (13)

    addPoint(index: number, position?: vec3, temporary?: boolean): void;
    addRestriction(properties: RestrictionProperties, token?: string): string | undefined;
    canRedo(): boolean;
    canUndo(): boolean;
    cancel(): void;
    getPointsData(): PointsData;
    movePoint(index: number, position: vec3, temporary?: boolean): void;
    redo(): void;
    removePoint(index: number, temporary?: boolean): void;
    removePoints(indices: number[]): void;
    removeRestriction(token: string): void;
    undo(): void;
    update(): PointsData | undefined;

    // #endregion Public Methods (13)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum MATERIAL_INDEX {
    DEFAULT = 0,
    HOVERED = 1,
    SELECTED = 2,
    SELECTED_HOVERED = 3,
    INSERTION = 4,
    INSERTION_HOVERED = 5
}

// #endregion Enums (1)
