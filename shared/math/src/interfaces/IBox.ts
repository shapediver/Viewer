import { mat4, vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";
import { ISphere } from "./ISphere";

export interface IBox extends IGeometry {
    // #region Properties (3)

    boundingSphere: ISphere;
    max: vec3;
    min: vec3;

    // #endregion Properties (3)

    // #region Public Methods (7)

    applyMatrix(matrix: mat4): IBox;
    clampPoint(point: vec3): vec3;
    clone(): IBox;
    containsPoint(point: vec3): boolean;
    intersect(origin: vec3, direction: vec3): number | null;
    isEmpty(): boolean;
    setFromAttributeArray(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array): IBox;
    union(box: IBox): IBox;

    // #endregion Public Methods (7)
}
