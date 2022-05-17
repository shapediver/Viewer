import { mat4, vec3 } from "gl-matrix";
import { IBox } from "./IBox";
import { IGeometry } from "./IGeometry";

export interface ISphere extends IGeometry {
    // #region Properties (2)

    center: vec3;
    radius: number;

    // #endregion Properties (2)

    // #region Public Methods (4)

    applyMatrix(matrix: mat4): ISphere;
    clampPoint(point: vec3): vec3;
    clone(): ISphere;
    containsPoint(point: vec3): boolean;
    setFromBox(box: IBox): ISphere;

    // #endregion Public Methods (4)
}