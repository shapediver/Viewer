import { AbstractCameraControls } from './AbstractCameraControls';
import { ICamera } from '../..';
import { CameraControlsLogic } from './CameraControlsLogic';
import { CameraControlsEventDistribution, } from './CameraControlsEventDistribution';
export class OrthographicCameraControls extends AbstractCameraControls {
    // #region Properties (2)

    private _settingsAdjustments = {
        autoRotationSpeed: 2 * Math.PI / 60 / 60,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 1.75,
        rotationSpeed: Math.PI,
        zoomSpeed: 0.025,
    };
    private _touchAdjustments = {
        autoRotationSpeed: 1.0,
        damping: 1.0,
        movementSmoothness: 1.0,
        panSpeed: 4.0 / 1.75,
        rotationSpeed: 1.5,
        zoomSpeed: 100.0,
    };

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(camera: ICamera, enabled: boolean) {
        super(camera, enabled);
        this._cameraLogic = new CameraControlsLogic(this, this._settingsAdjustments, this._touchAdjustments);
        this._cameraControlsEventDistribution = new CameraControlsEventDistribution(this, this._cameraLogic);
    }

    // #endregion Constructors (1)
}