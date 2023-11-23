import { vec2, vec3 } from 'gl-matrix';

export interface ICameraControlsLogic {
    // #region Public Methods (4)

    isWithinRestrictions(position: any, target: any): boolean;
    reset(): void;
    restrict(p: vec3, t: vec3, s?: vec2): { position: vec3, target: vec3, sceneRotation?: vec2 };
    update(time: number, manualInteraction: boolean): void

    // #endregion Public Methods (4)
}