import { mat4, vec3 } from "gl-matrix";
import { ICamera } from "../camera/ICamera";
import { ICameraControlsEventDistribution } from "./ICameraControlsEventDistribution";

export interface ICameraControls {
    // #region Properties (6)

    readonly cameraControlsEventDistribution: ICameraControlsEventDistribution;

    camera: ICamera;
    canvas?: HTMLCanvasElement;
    enabled: boolean;
    position: vec3;
    target: vec3;

    // #endregion Properties (6)

    // #region Public Methods (15)

    animate(path: { position: vec3, target: vec3 }[], options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean>;
    applyPositionMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void;
    applyPositionVector(vector: vec3, manualInteraction?: boolean | undefined): void;
    applyTargetMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void;
    applyTargetVector(vector: vec3, manualInteraction?: boolean | undefined): void;
    applyUpMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void;
    assignViewer(viewerId: string, canvas: HTMLCanvasElement):void;
    getPositionWithManualUpdates(): vec3;
    getPositionWithUpdates(): vec3;
    getTargetWithManualUpdates(): vec3;
    getTargetWithUpdates(): vec3;
    isMoving(): boolean;
    isWithinRestrictions(position: vec3, target: vec3): boolean;
    reset(): void;
    update(time: number): { position: vec3, target: vec3 };

    // #endregion Public Methods (15)
}
