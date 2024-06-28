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
    // #region Properties (2)

    /**
     * Priority of the restriction
     */
    readonly priority: number;

    /**
     * The snap restrictions of the restriction.
     */
    snapRestrictions: { [key: string]: ISnapRestriction; }

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Ray trace the restriction.
     * If the ray does not intersect the restriction, the method returns undefined.
     * 
     * @param ray The ray to trace.
     * @param metaData The meta data of the ray.
     * @returns The intersection point of the ray with the restriction.
     */
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum RESTRICTION_TYPE {
    PLANE = 'plane',
    GEOMETRY = 'geometry',
}

// #endregion Enums (1)
