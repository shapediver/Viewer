import { mat4 } from 'gl-matrix'

export enum SD_RENDERINGTYPE {
    THREEJS = 'threejs',
    BABYLONJS = 'babylonjs'
}

export interface ISDObject {
    // #region Properties (2)

    SDid: string;
    SDversion: string;
    SDtype: SD_RENDERINGTYPE;
    applyTransformation(transformation: mat4): void;

    // #endregion Properties (2)
}
