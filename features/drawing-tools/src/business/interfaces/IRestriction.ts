import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestrictionBase } from './IRestrictionBase';
import { ISnapRestriction } from './ISnapRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (2)

export type RestrictionMetaData = {
    index?: number;
    referencePoint?: vec3;
}

export type RestrictionProperties = {
    /**
     * Type of the restriction
     */
    type: RESTRICTION_TYPE;
};

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IRestriction extends IRestrictionBase {
    // #region Properties (1)

    /**
     * The snap restrictions of the restriction.
     */
    snapRestrictions: { [key: string]: ISnapRestriction; }

    // #endregion Properties (1)

    // #region Public Methods (2)

    /**
     * Ray trace the restriction.
     * If the ray does not intersect the restriction, the method returns undefined.
     * 
     * @param ray The ray to trace.
     * @param metaData The meta data of the ray.
     * @returns The intersection point of the ray with the restriction.
     */
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined;
    /**
     * Traverse the snap restrictions and sort them by priority.
     * Then for the highest priority snap restriction, call the snap method.
     * If there are multiple snap restrictions with the same priority, call the snap method for each of them.
     * 
     * @param point 
     * @param metaData 
     */
    snap(point: vec3, metaData?: RestrictionMetaData): vec3 | undefined;

    // #endregion Public Methods (2)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum RESTRICTION_TYPE {
    PLANE = 'plane'
}

// #endregion Enums (1)
