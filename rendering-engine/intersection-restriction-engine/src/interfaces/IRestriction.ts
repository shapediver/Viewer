import { IDragAnchor } from './IDragAnchor';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { ISnapRestriction } from './ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (3)

export type RayTraceResult = { distance?: number, transformation?: mat4, dragAnchor?: IDragAnchor, point: vec3, restriction: IRestriction | ISnapRestriction };
/* eslint-disable @typescript-eslint/ban-types */
export type RestrictionMetaData = {
    index?: number;
    referencePoint?: vec3;
    positionArray?: Float32Array;
    pressedKeys?: string[];
    dragAnchors?: IDragAnchor[];
};
export type RestrictionProperties = {
    /**
     * Type of the restriction
     */
    type: RESTRICTION_TYPE;
};

// #endregion Type aliases (3)

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

    // #region Public Methods (3)

    /**
     * Ray trace the restriction.
     * If the ray does not intersect the restriction, the method returns undefined.
     * 
     * @param ray The ray to trace.
     * @param metaData The meta data of the ray.
     * @returns The intersection point of the ray with the restriction.
     */
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined;
    /**
     * Remove the visualization of the restriction.
     */
    removeVisualization(): void;
    setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined

    // #endregion Public Methods (3)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum RESTRICTION_TYPE {
    PLANE = 'plane',
    GEOMETRY = 'geometry',
    POINT = 'point',
    LINE = 'line',
    CAMERA_PLANE = 'camera_plane',
}

// #endregion Enums (1)
