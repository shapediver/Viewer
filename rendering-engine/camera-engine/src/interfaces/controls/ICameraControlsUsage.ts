import { IDomEventListener } from '@shapediver/viewer.shared.services'
import { mat4, vec3 } from 'gl-matrix'
import { ICameraOptions } from '../camera/ICamera'

import { ICameraControls } from './ICameraControls'

export interface ICameraControlsUsage extends ICameraControls {
    // #region Properties (4)

    readonly canvas?: HTMLCanvasElement;

    // #endregion Properties (4)

    // #region Public Methods (12)

    animate(path: { position: vec3, target: vec3 }[], options: ICameraOptions) : Promise<boolean>
    applyPositionMatrix(matrix: mat4, manualInteraction?: boolean): void;
    applyTargetMatrix(matrix: mat4, manualInteraction?: boolean): void;
    applyPositionVector(vector: vec3, manualInteraction?: boolean): void;
    applyTargetVector(vector: vec3, manualInteraction?: boolean): void;
    applyUpMatrix(matrix: mat4, manualInteraction?: boolean): void;
    getPositionWithManualUpdates(): vec3;
    getTargetWithManualUpdates(): vec3;
    getPositionWithUpdates(): vec3;
    getTargetWithUpdates(): vec3;
    isMoving(): boolean;
    isWithinRestrictions(position: vec3, target: vec3): boolean;

    // #endregion Public Methods (12)
}
