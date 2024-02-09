import { AngularRestrictionApi } from '../implementation/restrictions/snap/AngularRestrictionApi';
import { AngularRestrictionProperties } from '../../business/implementation/restrictions/snap/AngularRestriction';
import { GridRestrictionApi } from '../implementation/restrictions/snap/GridRestrictionApi';
import { GridRestrictionProperties } from '../../business/implementation/restrictions/snap/GridRestriction';
import { IGeometryData } from '@shapediver/viewer.shared.types';
import { IRestrictionApi } from './IRestrictionApi';
import { PlaneRestrictionApi } from '../implementation/restrictions/intersection/PlaneRestrictionApi';
import { PlaneRestrictionProperties } from '../../business/implementation/restrictions/intersection/PlaneRestriction';
import { vec3 } from 'gl-matrix';

export interface IDrawingToolsApi {
    // #region Properties (2)

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

    // #endregion Properties (2)

    // #region Public Methods (8)

    /**
     * Add an angular snapping restriction to the drawing tool.
     * 
     * @param angularProperties The properties of the restriction.
     * @returns The api of the restriction.
     */
    addAngularSnappingRestriction(angularProperties: AngularRestrictionProperties): AngularRestrictionApi;

    /**
     * Add a grid snapping restriction to the drawing tool.
     * 
     * @param gridProperties The properties of the restriction.
     * @returns The api of the restriction.
     */
    addGridSnappingRestriction(gridProperties: GridRestrictionProperties): GridRestrictionApi;

    /**
     * Add a plane intersection restriction to the drawing tool.
     * 
     * @param planeProperties The properties of the restriction.
     * @returns The api of the restriction.
     */
    addPlaneIntersectionRestriction(planeProperties: PlaneRestrictionProperties): PlaneRestrictionApi;

    /**
     * Add a point to the drawing tool.
     * 
     * @param index The index of the point in the position array.
     * @param position The position of the point.
     */
    addPoint(index: number, position?: vec3 | undefined): void;

    /**
     * Close the drawing tool.
     */
    close(): void;

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

    // #endregion Public Methods (8)
}