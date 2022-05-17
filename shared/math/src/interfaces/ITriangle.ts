import { mat4, vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";

export interface ITriangle extends IGeometry {
    // #region Public Methods (2)

    applyMatrix(matrix: mat4): IGeometry;
    clone(): ITriangle;
    intersect(origin: vec3, direction: vec3): vec3 | null;

    // #endregion Public Methods (2)
}