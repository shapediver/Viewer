import { ICameraControls } from '../../interface/ICameraControls';
import { ICameraControlsManager } from '../../interface/ICameraControlsManager';
import { ICameraDefinition } from '../../interface/ICameraEngine';
import { CameraControlsEventDistribution } from './CameraControlsEventDistribution';
import { CameraControlsLogic } from './CameraControlsLogic';

export class CameraControlsManager implements ICameraControlsManager {
    // #region Properties (3)

    private _cameraEventDistribution: CameraControlsEventDistribution;
    private _cameraLogic: CameraControlsLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _cameraControls: ICameraControls) {
        this._cameraLogic = new CameraControlsLogic(this._cameraControls);
        this._cameraEventDistribution = new CameraControlsEventDistribution(this._cameraLogic);
        this._cameraControls.registerCameraControls(this);
    }

    // #endregion Constructors (1)

    // #region Public Methods (12)

    public isWithinRestrictions(definition: ICameraDefinition): boolean {
        return this._cameraLogic.isWithinRestrictions(definition.position, definition.target);
    }

    public onKeyDown(event: KeyboardEvent): void {
        this._cameraEventDistribution.onKeyDown(event);
    }

    public onMouseDown(event: MouseEvent): void {
        this._cameraEventDistribution.onMouseDown(event);
    }

    public onMouseMove(event: MouseEvent): void {
        this._cameraEventDistribution.onMouseMove(event);
    }

    public onMouseUp(event: MouseEvent): void {
        this._cameraEventDistribution.onMouseUp(event);
    }

    public onMouseWheel(event: WheelEvent): void {
        this._cameraEventDistribution.onMouseWheel(event);
    }

    public onTouchEnd(event: TouchEvent): void {
        this._cameraEventDistribution.onTouchEnd(event);
    }

    public onTouchMove(event: TouchEvent): void {
        this._cameraEventDistribution.onTouchMove(event);
    }

    public onTouchStart(event: TouchEvent): void {
        this._cameraEventDistribution.onTouchStart(event);
    }

    public reset(): void {
        this._cameraEventDistribution.reset();
        this._cameraLogic.reset();
    }

    public restrict(definition: ICameraDefinition): ICameraDefinition {
        return this._cameraLogic.restrict(definition.position, definition.target);
    }

    public update(time: number, manualInteraction: boolean): void {
        this._cameraLogic.update(time, manualInteraction);
    }

    // #endregion Public Methods (12)
};