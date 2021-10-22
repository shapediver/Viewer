import { mat4 } from 'gl-matrix'

export interface ISDObject {
    // #region Properties (2)

    SDid: string;
    SDversion: string;
    applyTransformation(transformation: mat4): void;

    // #endregion Properties (2)
}
