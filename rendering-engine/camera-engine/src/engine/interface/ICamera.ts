import { mat4, vec3 } from 'gl-matrix';
import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE } from './ICameraEngine';

export interface ICamera {
    // #region Properties (11)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERATYPE;

    autoAdjust: boolean;
    position: vec3;
    target: vec3;
    cameraMovementDuration: number;
    defaultPosition: vec3;
    defaultTarget: vec3;
    enableCameraControls: boolean;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    zoomExtentsFactor: number;

    // #endregion Properties (11)

    // #region Public Methods (1)

    update(time: number): {
        position: vec3,
        target: vec3
    };

    // #endregion Public Methods (1)
}