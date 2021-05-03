import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { CAMERATYPE, ICamera } from "../..";
import { AbstractCameraControls } from "./AbstractCameraControls";

import { CameraControlsEventDistribution as OrthographicCameraControlsEventDistribution } from './orthographic/CameraControlsEventDistribution';
import { CameraControlsLogic as OrthographicCameraControlsLogic } from './orthographic/CameraControlsLogic';

export class OrthographicCameraControls extends AbstractCameraControls {
    // #region Properties (9)

    private _damping: number = 0.1;
    private _enableKeyPan: boolean = false;
    private _enablePan: boolean = true;
    private _enableZoom: boolean = true;
    private _input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } =
        { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 } };
    private _keyPanSpeed: number = 0.5;
    private _movementSmoothness: number = 0.5;
    private _panSpeed: number = 0.5;
    private _zoomSpeed: number = 0.5;

    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(camera: ICamera, canvas: HTMLCanvasElement, enabled: boolean) {
        super(camera, canvas, enabled, CAMERATYPE.ORTHOGRAPHIC);
        this._cameraLogic = new OrthographicCameraControlsLogic(this);
        this._cameraControlsEventDistribution = new OrthographicCameraControlsEventDistribution(this, <OrthographicCameraControlsLogic>this._cameraLogic);
    }

    public applySettings() {
        this.damping = this._settingsEngine.cameraOrbitControls.damping.value;
        this.enableKeyPan = this._settingsEngine.cameraOrbitControls.enableKeyPan.value;
        this.enablePan = this._settingsEngine.cameraOrbitControls.enablePan.value;
        this.enableZoom = this._settingsEngine.cameraOrbitControls.enableZoom.value;
        this.input = this._settingsEngine.cameraOrbitControls.input.value;
        this.keyPanSpeed = this._settingsEngine.cameraOrbitControls.keyPanSpeed.value;
        this.movementSmoothness = this._settingsEngine.cameraOrbitControls.movementSmoothness.value;
        this.panSpeed = this._settingsEngine.cameraOrbitControls.panSpeed.value;
        this.zoomSpeed = this._settingsEngine.cameraOrbitControls.zoomSpeed.value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

    /**
     * Getter damping
     * @return {number}
     */
    public get damping(): number {
        return this._damping;
    }

    /**
     * Setter damping
     * @param {number} value
     */
    public set damping(value: number) {
        this._damping = value;
    }

    /**
     * Getter enableKeyPan
     * @return {boolean}
     */
    public get enableKeyPan(): boolean {
        return this._enableKeyPan;
    }

    /**
     * Setter enableKeyPan
     * @param {boolean} value
     */
    public set enableKeyPan(value: boolean) {
        this._enableKeyPan = value;
    }

    /**
     * Getter enablePan
     * @return {boolean}
     */
    public get enablePan(): boolean {
        return this._enablePan;
    }

    /**
     * Setter enablePan
     * @param {boolean} value
     */
    public set enablePan(value: boolean) {
        this._enablePan = value;
    }

    /**
     * Getter enableZoom
     * @return {boolean}
     */
    public get enableZoom(): boolean {
        return this._enableZoom;
    }

    /**
     * Setter enableZoom
     * @param {boolean} value
     */
    public set enableZoom(value: boolean) {
        this._enableZoom = value;
    }

    /**
     * Getter input
     * @return {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }}
     */
    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this._input;
    }

    /**
     * Setter input
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this._input = value;
    }

    /**
     * Getter keyPanSpeed
     * @return {number}
     */
    public get keyPanSpeed(): number {
        return this._keyPanSpeed;
    }

    /**
     * Setter keyPanSpeed
     * @param {number} value
     */
    public set keyPanSpeed(value: number) {
        this._keyPanSpeed = value;
    }

    /**
     * Getter movementSmoothness
     * @return {number}
     */
    public get movementSmoothness(): number {
        return this._movementSmoothness;
    }

    /**
     * Setter movementSmoothness
     * @param {number} value
     */
    public set movementSmoothness(value: number) {
        this._movementSmoothness = value;
    }

    /**
     * Getter panSpeed
     * @return {number}
     */
    public get panSpeed(): number {
        return this._panSpeed;
    }

    /**
     * Setter panSpeed
     * @param {number} value
     */
    public set panSpeed(value: number) {
        this._panSpeed = value;
    }

    /**
     * Getter zoomSpeed
     * @return {number}
     */
    public get zoomSpeed(): number {
        return this._zoomSpeed;
    }

    /**
     * Setter zoomSpeed
     * @param {number} value
     */
    public set zoomSpeed(value: number) {
        this._zoomSpeed = value;
    }

    // #endregion Public Accessors (18)
}