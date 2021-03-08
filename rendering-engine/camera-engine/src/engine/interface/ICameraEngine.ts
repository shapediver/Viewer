import { vec3 } from 'gl-matrix';
import { ICameraControls } from '../../controls/interface/ICameraControls';

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
    // #region Properties (3)

    readonly controls: ICameraControls;
    readonly type: CAMERATYPE;

    cameraDefinition: ICameraDefinition;

    // #endregion Properties (3)

    // #region Public Methods (1)

    update(time: number): ICameraDefinition;

    // #endregion Public Methods (1)
}