import { AbstractCameraControls } from './AbstractCameraControls';
import { ICamera } from '../..';
import { CameraControlsLogic } from './CameraControlsLogic';
import { IOrthographicControlsSettingsV3 } from '@shapediver/viewer.settings';
import { SettingsEngine } from '@shapediver/viewer.shared.services';
import { CameraControlsEventDistribution, } from './CameraControlsEventDistribution';
export class OrthographicCameraControls extends AbstractCameraControls {
    // #region Properties (1)

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

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(camera: ICamera, enabled: boolean) {
        super(camera, enabled);
        this._cameraLogic = new CameraControlsLogic(this, this._settingsAdjustments, this._touchAdjustments);
        this._cameraControlsEventDistribution = new CameraControlsEventDistribution(this, this._cameraLogic);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public applySettings(settingsEngine: SettingsEngine) {
        const cameraSetting = settingsEngine.camera.cameras[this.camera.id];
        if (!cameraSetting) return;
        this.reset();
        const controlsSettings = <IOrthographicControlsSettingsV3>cameraSetting.controls;
        this.damping = controlsSettings.damping;
        this.enableKeyPan = controlsSettings.enableKeyPan;
        this.enablePan = controlsSettings.enablePan;
        this.enableZoom = controlsSettings.enableZoom;
        // this.input = controlsSettings.input;
        this.keyPanSpeed = controlsSettings.keyPanSpeed;
        this.movementSmoothness = controlsSettings.movementSmoothness;
        this.panSpeed = controlsSettings.panSpeed;
        this.zoomSpeed = controlsSettings.zoomSpeed;
    }

    // #endregion Public Methods (1)
}