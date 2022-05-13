import { vec3 } from "gl-matrix";

export interface ISpherical {
    // #region Properties (3)

    phi: number;
    radius: number;
    theta: number;

    // #endregion Properties (3)

    // #region Public Methods (3)

    fromVec3(p: vec3): ISpherical;
    makeSafe(): ISpherical;
    toVec3(): vec3;

    // #endregion Public Methods (3)
}