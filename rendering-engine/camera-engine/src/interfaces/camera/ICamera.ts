import { Box } from '@shapediver/viewer.shared.math'
import { mat4, vec2, vec3 } from 'gl-matrix'

import { ICameraControls } from '../controls/ICameraControls'
import { CAMERA_TYPE } from '../ICameraEngine'

export interface ICamera {
    // #region Properties (13)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERA_TYPE;

    autoAdjust: boolean;
    cameraMovementDuration: number;
    defaultPosition: vec3;
    defaultTarget: vec3;
    enableCameraControls: boolean;
    position: vec3;
    order?: number;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    target: vec3;
    zoomExtentsFactor: number;

    // #endregion Properties (13)

    // #region Public Methods (6)

    animate(path: { position: vec3, target: vec3 }[], options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    reset(options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    set(position: vec3, target: vec3, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    zoomTo(zoomTarget?: Box, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    calculateZoomTo(zoomTarget?: Box, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; };
    project(p: vec3): vec2;
    unproject(p: vec3): vec3;

    // #endregion Public Methods (6)
}