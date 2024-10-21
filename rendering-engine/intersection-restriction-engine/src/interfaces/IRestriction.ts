import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { ISnapRestriction } from './ISnapRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (2)

/* eslint-disable @typescript-eslint/ban-types */
export type RestrictionMetaData = {
    index?: number;
    referencePoint?: vec3;
    positionArray?: Float32Array;
    pressedKeys?: string[];
};
export type RestrictionProperties = {
    /**
     * Type of the restriction
     */
    type: RESTRICTION_TYPE;
};

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IRestriction {
    // #region Properties (6)

    readonly id: string;
    readonly priority: number;
    readonly snapRestrictions: { [key: string]: ISnapRestriction; };
    readonly type: RESTRICTION_TYPE;

    enabled: boolean;
    showVisualization: boolean;

    // #endregion Properties (6)

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
     * Remove the visualization of the restriction.
     */
    removeVisualization(): void;

    // #endregion Public Methods (2)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum RESTRICTION_TYPE {
    PLANE = 'plane',
    GEOMETRY = 'geometry',
}

// #endregion Enums (1)
