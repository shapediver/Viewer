import { Box } from '@shapediver/viewer.shared.math';
import { mat4, vec2, vec3 } from 'gl-matrix';
import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE } from './ICameraEngine';

export interface ICamera {
    // #region Properties (13)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERATYPE;

    autoAdjust: boolean;
    cameraMovementDuration: number;
    defaultPosition: vec3;
    defaultTarget: vec3;
    enableCameraControls: boolean;
    position: vec3;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    target: vec3;
    zoomExtentsFactor: number;

    // #endregion Properties (13)

    // #region Public Methods (6)

    animate(path: { position: vec3, target: vec3 }[], options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    reset(options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    set(position: vec3, target: vec3, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    update(time: number): { position: vec3, target: vec3 };
    zoomTo(zoomTarget: string[] | Box | null, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;

    // #endregion Public Methods (6)
}