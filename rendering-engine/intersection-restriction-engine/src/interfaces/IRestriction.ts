import { IDragAnchor } from './IDragAnchor';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { ISnapRestriction } from './ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { mat4, vec3 } from 'gl-matrix';
import { PointRestrictionProperties } from '../implementation/restrictions/point/PointRestriction';
import { CameraPlaneRestrictionProperties } from '../implementation/restrictions/camera_plane/CameraPlaneRestriction';
import { GeometryRestrictionProperties } from '../implementation/restrictions/geometry/GeometryRestriction';
import { LineRestrictionProperties } from '../implementation/restrictions/line/LineRestriction';
import { PlaneRestrictionProperties } from '../implementation/restrictions/plane/PlaneRestriction';

// #region Type aliases (4)

export type RayTraceResult = { distance?: number, transformation?: mat4, dragAnchor?: IDragAnchor, point: vec3, restriction: IRestriction | ISnapRestriction };
export type RestrictionProperties = PointRestrictionProperties | PlaneRestrictionProperties | LineRestrictionProperties | GeometryRestrictionProperties | CameraPlaneRestrictionProperties;
export type RestrictionPropertiesBase = {
    id?: string;
    /**
     * Type of the restriction
     */
    type: RESTRICTION_TYPE;

    rotation?: {
        axis: vec3,
        angle: number
    }
};
export type RestrictionResult = { point: vec3, closestPointOnRay?: vec3, distance?: number, restriction: IRestriction, snapRestriction?: ISnapRestriction };

// #endregion Type aliases (4)

// #region Interfaces (4)

export interface DraggingRestrictionMetaData extends RestrictionMetaData {
    // #region Properties (4)

    dragAnchors?: IDragAnchor[];
    dragOrigin: vec3;
    node: ITreeNode;
    type: 'dragging';

    // #endregion Properties (4)
}

export interface DrawingRestrictionMetaData extends RestrictionMetaData {
    // #region Properties (3)

    index?: number;
    positionArray?: Float32Array;
    type: 'drawing';

    // #endregion Properties (3)
}

export interface IRestriction {
    // #region Properties (7)

    readonly id: string;
    readonly priority: number;
    readonly snapRestrictions: { [key: string]: ISnapRestriction; };
    readonly type: RESTRICTION_TYPE;

    enabled: boolean;
    rotation: {
        axis: vec3,
        angle: number
    };
    showVisualization: boolean;

    // #endregion Properties (7)

    // #region Public Methods (2)

    /**
     * Ray trace the restriction.
     * If the ray does not intersect the restriction, the method returns undefined.
     * 
     * @param ray The ray to trace.
     * @param metaData The meta data of the ray.
     * @returns The intersection point of the ray with the restriction.
     */
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): RestrictionResult | undefined;
    /**
     * Remove the visualization of the restriction.
     */
    removeVisualization(): void;

    // #endregion Public Methods (2)
}

/* eslint-disable @typescript-eslint/ban-types */
export interface RestrictionMetaData {
    // #region Properties (3)

    pressedKeys?: string[];
    startPoint?: vec3;
    type: 'drawing' | 'dragging';

    // #endregion Properties (3)
}

// #endregion Interfaces (4)

// #region Enums (1)

export enum RESTRICTION_TYPE {
    PLANE = 'plane',
    GEOMETRY = 'geometry',
    POINT = 'point',
    LINE = 'line',
    CAMERA_PLANE = 'camera_plane',
}

// #endregion Enums (1)

// #region Variables (2)

export const isDrawingRestriction = (metaData?: RestrictionMetaData): metaData is DrawingRestrictionMetaData => {
    return metaData?.type === 'drawing';
};
export const isDraggingRestriction = (metaData?: RestrictionMetaData): metaData is DraggingRestrictionMetaData => {
    return metaData?.type === 'dragging';
};

// #endregion Variables (2)
