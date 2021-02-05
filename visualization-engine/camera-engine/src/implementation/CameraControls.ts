import { mat4, vec3 } from 'gl-matrix';

import { ICameraControls } from '../interface/ICameraControls';
import { ICameraControlsManager } from '../interface/ICameraControlsManager';
import { ICameraDefinition } from '../interface/ICameraEngine';
import { CameraEventManager } from './CameraEventManager';

export class CameraControls implements ICameraControls {
    // #region Properties (8)

    private _cameraControlsManager!: ICameraControlsManager;
    private _cameraEventManager: CameraEventManager;
    private _manualInteraction: boolean = false;
    private _manualInteractionMatrices: {
        position: mat4[],
        target: mat4[],
    };
    private _moving: boolean = false;
    private _movingDuration: number = 0;
    private _nonmanualInteraction: boolean = false;
    private _nonmanualInteractionMatrices: {
        position: mat4[],
        target: mat4[],
    };

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(
        private _canvas: HTMLCanvasElement,
        private _enabled: boolean,
        private _position: vec3,
        private _target: vec3
    ) {
        this._cameraEventManager = new CameraEventManager(_canvas);
        this._manualInteractionMatrices = { position: [], target: [] };
        this._nonmanualInteractionMatrices = { position: [], target: [] };
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    /**
     * Getter canvas
     * @return {HTMLCanvasElement}
     */
    public get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /**
     * Setter canvas
     * @param {HTMLCanvasElement} value
     */
    public set canvas(value: HTMLCanvasElement) {
        this._canvas = value;
    }

    /**
     * Getter enabled
     * @return {boolean}
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * Setter enabled
     * @param {boolean} value
     */
    public set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * Getter position
     * @return {vec3}
     */
    public get position(): vec3 {
        return this._position;
    }

    /**
     * Setter position
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this._position = value;
    }

    /**
     * Getter target
     * @return {vec3}
     */
    public get target(): vec3 {
        return this._target;
    }

    /**
     * Setter target
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this._target = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (12)

    public animate(path: ICameraDefinition[], options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public applyPositionMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionMatrices.position.push(matrix);
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionMatrices.position.push(matrix);
        }
    }

    public applyTargetMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionMatrices.target.push(matrix);
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionMatrices.target.push(matrix);
        }
    }

    public applyUpMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }

    public dispose(): void {
        throw new Error("Method not implemented.");
    }

    public getPositionWithManualUpdates(): vec3 {
        let position = vec3.clone(this._position);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionMatrices.position.length - 1; i >= 0; i--) {
                position = vec3.transformMat4(position, position, this._manualInteractionMatrices.position[i]);
            }
        }
        return position;
    }

    public getTargetWithManualUpdates(): vec3 {
        let target = vec3.clone(this._target);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionMatrices.target.length - 1; i >= 0; i--)
                target = vec3.transformMat4(target, target, this._manualInteractionMatrices.target[i]);
        }
        return target;
    }

    public isMoving(): boolean {
        return this._manualInteraction || this._nonmanualInteraction;
    }

    public isWithinRestrictions(position: vec3, target: vec3): boolean {
        return this._cameraControlsManager.isWithinRestrictions({ position, target });
    }

    public registerCameraControls(cameraControlsManager: ICameraControlsManager): void {
        this._cameraControlsManager = cameraControlsManager;
        this._cameraEventManager.cameraControlsManager = cameraControlsManager;
    }

    public reset(): void {
        if (this._cameraControlsManager)
            this._cameraControlsManager.reset();
    }

    public update(time?: number | undefined): ICameraDefinition {
        //if (!this._enabled) return;
        let { position, target } = this._cameraControlsManager.restrict({ position: this.getPosition(), target: this.getTarget()});
        this._position = vec3.clone(position);
        this._target = vec3.clone(target);

        // // reset all values
        // if (this._manualInteraction === true && this._cameraInterpolationManager.active())
        //     this._cameraInterpolationManager.stop()

        this._manualInteraction = false;
        this._manualInteractionMatrices = { position: [], target: [] };
        // this._nonmanualInteraction = this._cameraInterpolationManager.active();
        // this._nonmanualInteractionMatrices = { position: [], target: [] };

        //if (this.camera.isOrthographicCamera) this._adjustOrthographicSides();

        this._cameraControlsManager.update(time!, this._nonmanualInteraction);

        //this._eventDispatch(this._manualInteraction || this._nonmanualInteraction, this._moving, this._movingDuration += time);
        this._moving = (this._manualInteraction || this._nonmanualInteraction);
        if (!this._moving) this._movingDuration = 0;

        return {
            position: vec3.clone(this._position),
            target: vec3.clone(this._target)
        }
    }

    // #endregion Public Methods (12)

    // #region Private Methods (2)

    private getPosition(): vec3 {
        let position = vec3.clone(this._position);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionMatrices.position.length - 1; i >= 0; i--) {
                position = vec3.transformMat4(position, position, this._manualInteractionMatrices.position[i]);
            }
        } else if (this._nonmanualInteraction) {
            for (let i = this._nonmanualInteractionMatrices.position.length - 1; i >= 0; i--)
                position = vec3.transformMat4(position, position, this._nonmanualInteractionMatrices.position[i]);
        }
        return position;
    }

    private getTarget(): vec3 {
        let target = vec3.clone(this._target);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionMatrices.target.length - 1; i >= 0; i--)
                target = vec3.transformMat4(target, target, this._manualInteractionMatrices.target[i]);
        } else if (this._nonmanualInteraction) {
            for (let i = this._nonmanualInteractionMatrices.target.length - 1; i >= 0; i--)
                target = vec3.transformMat4(target, target, this._nonmanualInteractionMatrices.target[i]);
        }
        return target;
    }

    // #endregion Private Methods (2)
}