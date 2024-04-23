import { AbstractCameraControls } from './AbstractCameraControls';
import { ICamera } from '../..';
import { CameraControlsLogic } from './CameraControlsLogic';
import { Converter, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services';
import { IOrbitControlsSettingsV3 } from '@shapediver/viewer.settings';
import { CameraControlsEventDistribution, } from './CameraControlsEventDistribution';

export class PerspectiveCameraControls extends AbstractCameraControls {
    // #region Properties (2)

    private readonly _converter: Converter = Converter.instance;
    private readonly _stateEngine: StateEngine = StateEngine.instance;
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
        panSpeed: 1.0 / 1.75,
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

    // #region Public Methods (1)

    public applySettings(settingsEngine: SettingsEngine) {
        const cameraSetting = settingsEngine.camera.cameras[this.camera.id];
        if (!cameraSetting) return;
        this.reset();
        const controlsSettings = <IOrbitControlsSettingsV3>cameraSetting.controls;
        this.autoRotationSpeed = controlsSettings.autoRotationSpeed;
        this.damping = controlsSettings.damping;
        this.enableAutoRotation = controlsSettings.enableAutoRotation;
        this.enableKeyPan = controlsSettings.enableKeyPan;
        this.enablePan = controlsSettings.enablePan;
        this.enableRotation = controlsSettings.enableRotation;
        this.enableZoom = controlsSettings.enableZoom;
        // this.input = controlsSettings.input;
        this.keyPanSpeed = controlsSettings.keyPanSpeed;
        this.movementSmoothness = controlsSettings.movementSmoothness;
        this.rotationSpeed = controlsSettings.rotationSpeed;
        this.panSpeed = controlsSettings.panSpeed;
        this.zoomSpeed = controlsSettings.zoomSpeed;

        if (controlsSettings.restrictions.position.cube.min.x === null) controlsSettings.restrictions.position.cube.min.x = -Infinity;
        if (controlsSettings.restrictions.position.cube.min.y === null) controlsSettings.restrictions.position.cube.min.y = -Infinity;
        if (controlsSettings.restrictions.position.cube.min.z === null) controlsSettings.restrictions.position.cube.min.z = -Infinity;
        if (controlsSettings.restrictions.position.cube.max.x === null) controlsSettings.restrictions.position.cube.max.x = Infinity;
        if (controlsSettings.restrictions.position.cube.max.y === null) controlsSettings.restrictions.position.cube.max.y = Infinity;
        if (controlsSettings.restrictions.position.cube.max.z === null) controlsSettings.restrictions.position.cube.max.z = Infinity;
        if (controlsSettings.restrictions.position.sphere.radius === null) controlsSettings.restrictions.position.sphere.radius = Infinity;
        if (controlsSettings.restrictions.target.cube.min.x === null) controlsSettings.restrictions.target.cube.min.x = -Infinity;
        if (controlsSettings.restrictions.target.cube.min.y === null) controlsSettings.restrictions.target.cube.min.y = -Infinity;
        if (controlsSettings.restrictions.target.cube.min.z === null) controlsSettings.restrictions.target.cube.min.z = -Infinity;
        if (controlsSettings.restrictions.target.cube.max.x === null) controlsSettings.restrictions.target.cube.max.x = Infinity;
        if (controlsSettings.restrictions.target.cube.max.y === null) controlsSettings.restrictions.target.cube.max.y = Infinity;
        if (controlsSettings.restrictions.target.cube.max.z === null) controlsSettings.restrictions.target.cube.max.z = Infinity;
        if (controlsSettings.restrictions.target.sphere.radius === null) controlsSettings.restrictions.target.sphere.radius = Infinity;
        if (controlsSettings.restrictions.rotation.minAzimuthAngle === null) controlsSettings.restrictions.rotation.minAzimuthAngle = -Infinity;
        if (controlsSettings.restrictions.rotation.maxAzimuthAngle === null) controlsSettings.restrictions.rotation.maxAzimuthAngle = Infinity;
        if (controlsSettings.restrictions.zoom.maxDistance === null) controlsSettings.restrictions.zoom.maxDistance = Infinity;

        this.cubePositionRestriction = {
            min: this._converter.toVec3(controlsSettings.restrictions.position.cube.min),
            max: this._converter.toVec3(controlsSettings.restrictions.position.cube.max)
        };
        this.spherePositionRestriction = {
            center: this._converter.toVec3(controlsSettings.restrictions.position.sphere.center),
            radius: controlsSettings.restrictions.position.sphere.radius
        };
        this.cubeTargetRestriction = {
            min: this._converter.toVec3(controlsSettings.restrictions.target.cube.min),
            max: this._converter.toVec3(controlsSettings.restrictions.target.cube.max)
        };
        this.sphereTargetRestriction = {
            center: this._converter.toVec3(controlsSettings.restrictions.target.sphere.center),
            radius: controlsSettings.restrictions.target.sphere.radius
        };
        this.rotationRestriction = controlsSettings.restrictions.rotation;
        this.zoomRestriction = controlsSettings.restrictions.zoom;
    }

    // #endregion Public Methods (1)
}