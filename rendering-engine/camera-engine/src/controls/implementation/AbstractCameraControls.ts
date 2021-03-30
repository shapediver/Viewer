import { mat4, vec3 } from 'gl-matrix';

import { ICameraControls } from '../interface/ICameraControls';
import { CAMERATYPE } from '../../engine/interface/ICameraEngine';
import { CameraInterpolationManager } from './CameraInterpolationManager';
import { ICameraControlsLogic } from '../interface/ICameraControlsLogic';
import { ICameraControlsEventDistribution } from '../interface/ICameraControlsEventDistribution';
import { ICameraControlsUsage } from '../interface/ICameraControlsUsage';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { container } from 'tsyringe';

export class AbstractCameraControls implements ICameraControlsUsage {
    // #region Properties (11)

    private readonly _cameraInterpolationManager: CameraInterpolationManager = new CameraInterpolationManager(this);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

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

    protected _cameraControlsEventDistribution!: ICameraControlsEventDistribution;
    protected _cameraLogic!: ICameraControlsLogic;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        private _canvas: HTMLCanvasElement,
        private _enabled: boolean,
        type: CAMERATYPE
    ) {
        this._manualInteractionMatrices = { position: [], target: [] };
        this._nonmanualInteractionMatrices = { position: [], target: [] };
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get cameraControlsEventDistribution(): ICameraControlsEventDistribution {
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

    // #region Public Methods (10)

    public animate(path: { position: vec3, target: vec3 }[], options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
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

    public update(time: number): { position: vec3, target: vec3 } {
        if (!this._enabled) 
            return { position: vec3.clone(this._position), target: vec3.clone(this._target) };
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

        const oldMovement = this._moving;
        const cameraDefinition = {
            position: vec3.clone(this._position),
            target: vec3.clone(this._target)
        };

        this._movingDuration += time;
        this._moving = (this._manualInteraction || this._nonmanualInteraction);

        switch(true) {
            case oldMovement !== this._moving && this._moving === true:
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, { cameraDefinition, movementDuration: 0 });
                break;
            case oldMovement !== this._moving && this._moving === false:
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_END, { cameraDefinition, movementDuration: this._movingDuration });
                break;
            default: 
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_MOVE, { cameraDefinition, movementDuration: this._movingDuration });
        }
        
        if (!this._moving) this._movingDuration = 0;

        return cameraDefinition;
    }

    // #endregion Public Methods (10)

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