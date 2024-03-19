import { IGeometryData } from '@shapediver/viewer.shared.types';
import { IRestrictionApi } from './IRestrictionApi';
import { RestrictionProperties } from '../../business/interfaces/IRestriction';
import { vec3 } from 'gl-matrix';

export interface IDrawingToolsApi {
    // #region Properties (5)

    /**
     * Check if the drawing tool is closed.
     */
    readonly closed: boolean;

    /**
     * The geometry data of the drawing tool.
     */
    readonly geometryData: IGeometryData;

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

    // #region Public Methods (8)

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
    addRestriction(Properties: RestrictionProperties): IRestrictionApi | undefined;

    /**
     * Cancel the drawing tool.
     */
    cancel(): void;

    /**
     * Close the drawing tool.
     */
    close(): void;

    /**
     * Finish the drawing tool.
     * 
     * @returns The geometry data of the drawing tool.
     */
    finish(): IGeometryData | undefined;

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
     * Receive an update of the drawing tool.
     * 
     * @returns The geometry data of the drawing tool.
     */
    update(): IGeometryData | undefined;

    // #endregion Public Methods (8)
}