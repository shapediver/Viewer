import { vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";

export interface IPlane extends IGeometry {
    // #region Properties (2)

    constant: number;
    normal: vec3;

    // #endregion Properties (2)

    // #region Public Methods (5)

    clampPoint(point: vec3): vec3;
    containsPoint(point: vec3): boolean;
    distanceToPoint(point: vec3): number;
    intersect(origin: vec3, direction: vec3): number | null;
    setFromNormalAndCoplanarPoint(normal: vec3, point: vec3): IPlane;

    // #endregion Public Methods (5)
}