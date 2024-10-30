import {
    IRestrictionApi,
    RestrictionProperties
} from '@shapediver/viewer.rendering-engine.intersection-restriction-engine';
import { PointsData } from '../../business/interfaces/IDrawingToolsManager';
import { vec3 } from 'gl-matrix';

export interface IDrawingToolsApi {
    // #region Properties (5)

    /**
     * Check if the drawing tool is closed.
     */
    readonly closed: boolean;
    /**
     * The points data of the drawing tool.
     */
    readonly pointsData: PointsData;
    /**
     * The restrictions of the drawing tool.
     */
    readonly restrictions: {
        [key: string]: IRestrictionApi
    };

    /**
     * Show the distance labels of the drawing tool.
     */
    showDistanceLabels: boolean;
    /**
     * Show the point labels of the drawing tool.
     */
    showPointLabels: boolean;

    // #endregion Properties (5)

    // #region Public Methods (11)

    /**
     * Add a point to the drawing tool.
     * 
     * @param index The index of the point in the position array.
     * @param position The position of the point.
     */
    addPoint(index: number, position?: vec3 | undefined): void;
    /**
     * Add a ray tracing intersection restriction to the drawing tool.
     * 
     * @param properties The properties of the restriction.
     * @returns The api of the restriction.
     */
    addRestriction(properties: RestrictionProperties, token?: string): IRestrictionApi | undefined;
    /**
     * Check if the drawing tool can redo the last action.
     */
    canRedo(): boolean;
    /**
     * Check if the drawing tool can undo the last action.
     */
    canUndo(): boolean;
    /**
     * Cancel the drawing tool.
     */
    cancel(): void;
    /**
     * Close the drawing tool.
     */
    close(): void;
    /**
     * Redo the last action of the drawing tool.
     */
    redo(): void;
    /**
     * Remove a point from the drawing tool.
     * 
     * @param index The index of the point in the position array.
     */
    removePoint(index: number): void;
    /**
     * Remove a restriction from the drawing tool.
     * 
     * @param id 
     */
    removeRestriction(id: string): void;
    /**
     * Undo the last action of the drawing tool.
     */
    undo(): void;
    /**
     * Receive an update of the drawing tool.
     * 
     * @returns The points data of the drawing tool.
     */
    update(): PointsData | undefined;

    // #endregion Public Methods (11)
}