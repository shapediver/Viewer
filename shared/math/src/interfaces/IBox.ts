import { vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";
import { ISphere } from "./ISphere";

export interface IBox extends IGeometry {
    // #region Properties (3)

    boundingSphere: ISphere;
    max: vec3;
    min: vec3;

    // #endregion Properties (3)

    // #region Public Methods (6)

    clampPoint(point: vec3): vec3;
    containsPoint(point: vec3): boolean;
    intersect(origin: vec3, direction: vec3): number | null;
    isEmpty(): boolean;
    setFromAttributeArray(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array): IBox;
    union(box: IBox): IBox;

    // #endregion Public Methods (6)
}
