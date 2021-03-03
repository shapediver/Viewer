import { mat4, vec3 } from 'gl-matrix';

import { ICameraDefinition } from '../../engine/interface/ICameraEngine';
import { CameraControlsEventDistribution } from '../implementation/orbit/CameraControlsEventDistribution';

export interface ICameraControls {
    // #region Properties (4)

    readonly canvas: HTMLCanvasElement;
    readonly cameraControlsEventDistribution: CameraControlsEventDistribution;

    enabled: boolean;
    position: vec3;
    target: vec3;

    // #endregion Properties (4)

    // #region Public Methods (12)

    animate(path: ICameraDefinition[], options: { easing?: string|Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string|Function }) : Promise<boolean>
    applyPositionMatrix(matrix: mat4, manualInteraction?: boolean): void;
    applyTargetMatrix(matrix: mat4, manualInteraction?: boolean): void;
    applyUpMatrix(matrix: mat4, manualInteraction?: boolean): void;
    getPositionWithManualUpdates(): vec3;
    getTargetWithManualUpdates(): vec3;
    isMoving(): boolean;
    isWithinRestrictions(position: vec3, target: vec3): boolean;
    update(time: number): ICameraDefinition;

    // #endregion Public Methods (12)
}
