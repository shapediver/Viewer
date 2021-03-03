import { mat4, vec3 } from 'gl-matrix';

import { ICameraControls } from '../interface/ICameraControls';
import { CAMERATYPE, ICameraDefinition } from '../../engine/interface/ICameraEngine';
import { CameraControlsEventDistribution as OrbitCameraControlsEventDistribution } from './orbit/CameraControlsEventDistribution';
import { CameraControlsLogic as OrbitCameraControlsLogic } from './orbit/CameraControlsLogic';
import { CameraControlsEventDistribution as OrthographicCameraControlsEventDistribution } from './orthographic/CameraControlsEventDistribution';
import { CameraControlsLogic as OrthographicCameraControlsLogic } from './orthographic/CameraControlsLogic';
import { CameraInterpolationManager } from './CameraInterpolationManager';

export class CameraControls implements ICameraControls {
    // #region Properties (10)

    private readonly _cameraControlsEventDistribution: OrbitCameraControlsEventDistribution | OrthographicCameraControlsEventDistribution;
    private readonly _cameraInterpolationManager: CameraInterpolationManager = new CameraInterpolationManager(this);

    private _cameraLogic: OrbitCameraControlsLogic | OrthographicCameraControlsLogic;
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
    private _position: vec3 = vec3.create();
    private _target: vec3 = vec3.create();

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(
        private _canvas: HTMLCanvasElement,
        private _enabled: boolean,
        type: CAMERATYPE
    ) {
        if(type === CAMERATYPE.ORTHOGRAPHIC) {
            this._cameraLogic = new OrthographicCameraControlsLogic(this);
            this._cameraControlsEventDistribution = new OrthographicCameraControlsEventDistribution(this._cameraLogic);
        } else {
            this._cameraLogic = new OrbitCameraControlsLogic(this);
            this._cameraControlsEventDistribution = new OrbitCameraControlsEventDistribution(this._cameraLogic);
        }
        this._manualInteractionMatrices = { position: [], target: [] };
        this._nonmanualInteractionMatrices = { position: [], target: [] };
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get cameraControlsEventDistribution(): OrbitCameraControlsEventDistribution | OrthographicCameraControlsEventDistribution {
        return this._cameraControlsEventDistribution;
    }

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
        if (!value) {
            this._manualInteraction = false;
            this._manualInteractionMatrices = { position: [], target: [] };
            this._nonmanualInteraction = false;
            this._nonmanualInteractionMatrices = { position: [], target: [] };

            this._cameraControlsEventDistribution.reset();
            this._cameraLogic.reset();
        }
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

    // #endregion Public Accessors (9)

    // #region Public Methods (11)

    public animate(path: ICameraDefinition[], options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        if(options && options.duration === 0) {
            this._position = path[path.length-1].position;
            this._target = path[path.length-1].target;
            return new Promise<boolean>(resolve => resolve(true));
        } 
    
        this._manualInteraction = false;
        this._manualInteractionMatrices = { position: [], target: [] };
        return this._cameraInterpolationManager.interpolate(path, options);
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
        return this._cameraLogic.isWithinRestrictions(position, target);
    }

    public reset(): void {
        this._cameraControlsEventDistribution.reset();
        this._cameraLogic.reset();
    }

    public update(time: number): ICameraDefinition {
        if (!this._enabled) this._cameraLogic.restrict(this.getPosition(), this.getTarget());
        let { position, target } = this._cameraLogic.restrict(this.getPosition(), this.getTarget());
        this._position = vec3.clone(position);
        this._target = vec3.clone(target);

        // reset all values
        if(this._manualInteraction === true && this._cameraInterpolationManager.active())
            this._cameraInterpolationManager.stop()

        this._manualInteraction = false;
        this._manualInteractionMatrices = { position: [], target: [] };
        this._nonmanualInteraction = this._cameraInterpolationManager.active();
        this._nonmanualInteractionMatrices = { position: [], target: [] };

        this._cameraLogic.update(time, this._nonmanualInteraction);

        this._moving = (this._manualInteraction || this._nonmanualInteraction);
        if (!this._moving) this._movingDuration = 0;

        return {
            position: vec3.clone(this._position),
            target: vec3.clone(this._target)
        }
    }

    // #endregion Public Methods (11)

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