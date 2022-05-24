import { IOrthographicControlsSettingsV3 } from '@shapediver/viewer.settings'
import { SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { CAMERA_TYPE, ICamera } from '../..'
import { IOrthographicCameraControls } from '../../interfaces/controls/IOrthographicCameraControls'
import { AbstractCameraControls } from './AbstractCameraControls'
import {
  CameraControlsEventDistribution as OrthographicCameraControlsEventDistribution,
} from './orthographic/CameraControlsEventDistribution'
import { CameraControlsLogic as OrthographicCameraControlsLogic } from './orthographic/CameraControlsLogic'

export class OrthographicCameraControls extends AbstractCameraControls implements IOrthographicCameraControls {
    // #region Properties (9)

    private _damping: number = 0.1;
    private _enableKeyPan: boolean = false;
    private _enablePan: boolean = true;
    private _enableZoom: boolean = true;
    private _input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } = { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, };
    private _keyPanSpeed: number = 0.5;
    private _movementSmoothness: number = 0.5;
    private _panSpeed: number = 0.5;
    private _zoomSpeed: number = 0.5;

    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(camera: ICamera, enabled: boolean) {
        super(camera, enabled, CAMERA_TYPE.ORTHOGRAPHIC);
        this._cameraLogic = new OrthographicCameraControlsLogic(this);
        this._cameraControlsEventDistribution = new OrthographicCameraControlsEventDistribution(this, <OrthographicCameraControlsLogic>this._cameraLogic);
    }

    public applySettings(settingsEngine: SettingsEngine) {
        const cameraSetting = settingsEngine.camera.cameras[this.camera.id];
        if(!cameraSetting) return;
        this.reset();
        const controlsSettings = <IOrthographicControlsSettingsV3>cameraSetting.controls;
        this.damping = controlsSettings.damping;
        this.enableKeyPan = controlsSettings.enableKeyPan;
        this.enablePan = controlsSettings.enablePan;
        this.enableZoom = controlsSettings.enableZoom;
        this.input = controlsSettings.input;
        this.keyPanSpeed = controlsSettings.keyPanSpeed;
        this.movementSmoothness = controlsSettings.movementSmoothness;
        this.panSpeed = controlsSettings.panSpeed;
        this.zoomSpeed = controlsSettings.zoomSpeed;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

    public get damping(): number {
        return this._damping;
    }

    public set damping(value: number) {
        this._damping = value;
    }

    public get enableKeyPan(): boolean {
        return this._enableKeyPan;
    }

    public set enableKeyPan(value: boolean) {
        this._enableKeyPan = value;
    }

    public get enablePan(): boolean {
        return this._enablePan;
    }

    public set enablePan(value: boolean) {
        this._enablePan = value;
    }

    public get enableZoom(): boolean {
        return this._enableZoom;
    }

    public set enableZoom(value: boolean) {
        this._enableZoom = value;
    }

    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this._input;
    }

    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this._input = value;
    }

    public get keyPanSpeed(): number {
        return this._keyPanSpeed;
    }

    public set keyPanSpeed(value: number) {
        this._keyPanSpeed = value;
    }

    public get movementSmoothness(): number {
        return this._movementSmoothness;
    }

    public set movementSmoothness(value: number) {
        this._movementSmoothness = value;
    }

    public get panSpeed(): number {
        return this._panSpeed;
    }

    public set panSpeed(value: number) {
        this._panSpeed = value;
    }

    public get zoomSpeed(): number {
        return this._zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        this._zoomSpeed = value;
    }

    // #endregion Public Accessors (18)
}