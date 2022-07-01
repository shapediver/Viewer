import { mat4, vec3 } from 'gl-matrix'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { CAMERA_TYPE } from '../../interfaces/ICameraEngine'
import { ICamera, ICameraOptions } from '../../interfaces/camera/ICamera'
import { ICameraControlsUsage } from '../../interfaces/controls/ICameraControlsUsage'
import { CameraInterpolationManager } from '../interpolation/CameraInterpolationManager'
import { ICameraControlsEventDistribution } from '../../interfaces/controls/ICameraControlsEventDistribution'
import { ICameraControlsLogic } from '../../interfaces/controls/ICameraControlsLogic'

export class AbstractCameraControls implements ICameraControlsUsage {
    // #region Properties (11)

    private readonly _cameraInterpolationManager: CameraInterpolationManager;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    private _canvas?: HTMLCanvasElement;
    private _manualInteraction: boolean = false;
    private _manualInteractionTransformations: {
        position: {
            matrix?: mat4,
            vector?: vec3
        }[],
        target: {
            matrix?: mat4,
            vector?: vec3
        }[],
    };
    private _moving: boolean = false;
    private _movingDuration: number = 0;
    private _nonmanualInteraction: boolean = false;
    private _nonmanualInteractionTransformations: {
        position: {
            matrix?: mat4,
            vector?: vec3
        }[],
        target: {
            matrix?: mat4,
            vector?: vec3
        }[],
    };
    private _position: vec3 = vec3.create();
    private _target: vec3 = vec3.create();
    private _viewportId?: string;

    protected _cameraControlsEventDistribution!: ICameraControlsEventDistribution;
    protected _cameraLogic!: ICameraControlsLogic;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        private _camera: ICamera,
        private _enabled: boolean,
        type: CAMERA_TYPE
    ) {
        this._cameraInterpolationManager = new CameraInterpolationManager(this._camera, this);
        this._manualInteractionTransformations = { position: [], target: [] };
        this._nonmanualInteractionTransformations = { position: [], target: [] };
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public assignViewer(viewportId: string, canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._viewportId = viewportId;
    }

    public get cameraControlsEventDistribution(): ICameraControlsEventDistribution {
        return this._cameraControlsEventDistribution;
    }

    public get canvas(): HTMLCanvasElement | undefined {
        return this._canvas;
    }

    public set canvas(value: HTMLCanvasElement | undefined) {
        this._canvas = value;
    }

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if (!value) {
            this._manualInteraction = false;
            this._manualInteractionTransformations = { position: [], target: [] };
            this._nonmanualInteraction = false;
            this._nonmanualInteractionTransformations = { position: [], target: [] };

            this._cameraControlsEventDistribution.reset();
            this._cameraLogic.reset();
        }
        this._enabled = value;
    }

    public get camera(): ICamera {
        return this._camera;
    }

    public set camera(value: ICamera) {
        this._camera = value;
    }

    public get position(): vec3 {
        return this._position;
    }

    public set position(value: vec3) {
        this._position = value;
    }

    public get target(): vec3 {
        return this._target;
    }

    public set target(value: vec3) {
        this._target = value;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (10)

    public animate(path: { position: vec3, target: vec3 }[], options: ICameraOptions): Promise<boolean> {
        if(options && options.duration === 0) {
            this._position = path[path.length-1].position;
            this._target = path[path.length-1].target;
            return new Promise<boolean>(resolve => resolve(true));
        }
    
        this._manualInteraction = false;
        this._manualInteractionTransformations = { position: [], target: [] };
        return this._cameraInterpolationManager.interpolate(path, options);
    }

    public applyPositionVector(vector: vec3, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionTransformations.position.push({vector});
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionTransformations.position.push({vector});
        }
    }

    public applyTargetVector(vector: vec3, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionTransformations.target.push({vector});
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionTransformations.target.push({vector});
        }
    }

    public applyPositionMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionTransformations.position.push({matrix});
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionTransformations.position.push({matrix});
        }
    }

    public applyTargetMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        if (this._manualInteraction || manualInteraction) {
            this._manualInteraction = true;
            this._manualInteractionTransformations.target.push({matrix});
        } else {
            this._nonmanualInteraction = true;
            this._nonmanualInteractionTransformations.target.push({matrix});
        }
    }

    public applyUpMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void {
        // https://shapediver.atlassian.net/browse/SS-2949
        throw new Error("Method not implemented.");
    }

    public getPositionWithManualUpdates(): vec3 {
        let position = vec3.clone(this._position);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionTransformations.position.length - 1; i >= 0; i--) {
                if(this._manualInteractionTransformations.position[i].matrix) {
                    position = vec3.transformMat4(position, position, this._manualInteractionTransformations.position[i].matrix!);
                } else {
                    position = vec3.add(position, position, this._manualInteractionTransformations.position[i].vector!);
                }
            }
        }
        return position;
    }

    public getTargetWithManualUpdates(): vec3 {
        let target = vec3.clone(this._target);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionTransformations.target.length - 1; i >= 0; i--) {
                if(this._manualInteractionTransformations.target[i].matrix) {
                    target = vec3.transformMat4(target, target, this._manualInteractionTransformations.target[i].matrix!);
                } else {
                    target = vec3.add(target, target, this._manualInteractionTransformations.target[i].vector!);
                }
            }
        }
        return target;
    }

    public getPositionWithUpdates(): vec3 {
        return this.getPosition();
    }

    public getTargetWithUpdates(): vec3 {
        return this.getTarget();
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

        // reset all values
        if(this._manualInteraction === true && this._cameraInterpolationManager.active())
            this._cameraInterpolationManager.stop()

        let { position, target } = this._cameraLogic.restrict(this.getPosition(), this.getTarget());
        this._position = vec3.clone(position);
        this._target = vec3.clone(target);

        this._manualInteraction = false;
        this._manualInteractionTransformations = { position: [], target: [] };
        this._nonmanualInteraction = this._cameraInterpolationManager.active();
        this._nonmanualInteractionTransformations = { position: [], target: [] };

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
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, { viewportId: this._viewportId, cameraId: this.camera.id });
                break;
            case oldMovement !== this._moving && this._moving === false:
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_END, { viewportId: this._viewportId, cameraId: this.camera.id });
                break;
            default: 
                this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_MOVE, { viewportId: this._viewportId, cameraId: this.camera.id });
        }
        
        if (!this._moving) this._movingDuration = 0;

        return cameraDefinition;
    }

    // #endregion Public Methods (10)

    // #region Private Methods (2)

    private getPosition(): vec3 {
        let position = vec3.clone(this._position);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionTransformations.position.length - 1; i >= 0; i--) {
                if(this._manualInteractionTransformations.position[i].matrix) {
                    position = vec3.transformMat4(position, position, this._manualInteractionTransformations.position[i].matrix!);
                } else {
                    position = vec3.add(position, position, this._manualInteractionTransformations.position[i].vector!);
                }
            }
        } else if (this._nonmanualInteraction) {
            for (let i = this._nonmanualInteractionTransformations.position.length - 1; i >= 0; i--) {
                if(this._nonmanualInteractionTransformations.position[i].matrix) {
                    position = vec3.transformMat4(position, position, this._nonmanualInteractionTransformations.position[i].matrix!);
                } else {
                    position = vec3.add(position, position, this._nonmanualInteractionTransformations.position[i].vector!);
                }
            }
        }
        return position;
    }

    private getTarget(): vec3 {
        let target = vec3.clone(this._target);
        if (this._manualInteraction) {
            for (let i = this._manualInteractionTransformations.target.length - 1; i >= 0; i--) {
                if(this._manualInteractionTransformations.target[i].matrix) {
                    target = vec3.transformMat4(target, target, this._manualInteractionTransformations.target[i].matrix!);
                } else {
                    target = vec3.add(target, target, this._manualInteractionTransformations.target[i].vector!);
                }
            }
        } else if (this._nonmanualInteraction) {
            for (let i = this._nonmanualInteractionTransformations.target.length - 1; i >= 0; i--) {
                if(this._nonmanualInteractionTransformations.target[i].matrix) {
                    target = vec3.transformMat4(target, target, this._nonmanualInteractionTransformations.target[i].matrix!);
                } else {
                    target = vec3.add(target, target, this._nonmanualInteractionTransformations.target[i].vector!);
                }
            }
        }
        return target;
    }

    // #endregion Private Methods (2)
}