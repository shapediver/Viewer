import { vec3 } from 'gl-matrix'

export interface ICameraControlsLogic {
    isWithinRestrictions(position: any, target: any): boolean;
    reset(): void;
    restrict(p: vec3, t: vec3): { position: vec3, target: vec3 };
    update(time: number, manualInteraction: boolean): void
}