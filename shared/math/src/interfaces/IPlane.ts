import { mat4, vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";

export interface IPlane extends IGeometry {
    // #region Properties (2)

    constant: number;
    normal: vec3;

    // #endregion Properties (2)

    // #region Public Methods (6)

    applyMatrix(matrix: mat4): IPlane;
    clampPoint(point: vec3): vec3;
    clone(): IPlane;
    containsPoint(point: vec3): boolean;
    distanceToPoint(point: vec3): number;
    intersect(origin: vec3, direction: vec3): number | null;
    setFromNormalAndCoplanarPoint(normal: vec3, point: vec3): IPlane;

    // #endregion Public Methods (6)
}