import { vec3 } from 'gl-matrix';

export interface ICameraDefinition {
    // #region Properties (2)

    position: vec3;
    target: vec3;

    // #endregion Properties (2)
}


export enum CAMERATYPE {
    PERSPECTIVE = 'perspective',
    ORTHOGRAPHIC = 'orthographic'
}

export interface ICameraEngine {
    // #region Properties (1)

    cameraDefinition: ICameraDefinition;
    readonly type: CAMERATYPE;

    // #endregion Properties (1)

    // #region Public Methods (1)

    update(time: number): ICameraDefinition;

    // #endregion Public Methods (1)
}