import { vec3 } from 'gl-matrix';

export interface ICameraDefinition {
    // #region Properties (2)

    position: vec3;
    target: vec3;

    // #endregion Properties (2)
}

export interface ICameraEngine {
    // #region Properties (1)

    cameraDefinition: ICameraDefinition;

    // #endregion Properties (1)

    // #region Public Methods (1)

    update(time: number): ICameraDefinition;

    // #endregion Public Methods (1)
}