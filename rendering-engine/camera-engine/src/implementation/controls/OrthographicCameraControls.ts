import { SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { CAMERATYPE, ICamera } from '../..'
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
    private _updateCBs: (() => void)[] = [];

    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(viewerId: string, camera: ICamera, canvas: HTMLCanvasElement, enabled: boolean) {
        super(viewerId, camera, canvas, enabled, CAMERATYPE.ORTHOGRAPHIC);
        this._cameraLogic = new OrthographicCameraControlsLogic(this);
        this._cameraControlsEventDistribution = new OrthographicCameraControlsEventDistribution(this, <OrthographicCameraControlsLogic>this._cameraLogic);
    }

    public applySettings() {
        this.damping = this._settingsEngine.cameraOrthographicControls.damping.value;
        this.enableKeyPan = this._settingsEngine.cameraOrthographicControls.enableKeyPan.value;
        this.enablePan = this._settingsEngine.cameraOrthographicControls.enablePan.value;
        this.enableZoom = this._settingsEngine.cameraOrthographicControls.enableZoom.value;
        this.input = this._settingsEngine.cameraOrthographicControls.input.value;
        this.keyPanSpeed = this._settingsEngine.cameraOrthographicControls.keyPanSpeed.value;
        this.movementSmoothness = this._settingsEngine.cameraOrthographicControls.movementSmoothness.value;
        this.panSpeed = this._settingsEngine.cameraOrthographicControls.panSpeed.value;
        this.zoomSpeed = this._settingsEngine.cameraOrthographicControls.zoomSpeed.value;
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
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
        this._updateCBs.forEach(v => v());
    }

    public addUpdateCB(value: () => void) {
        this._updateCBs.push(value)
    }

    // #endregion Public Accessors (18)
}