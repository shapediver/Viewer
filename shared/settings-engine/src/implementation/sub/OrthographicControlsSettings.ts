import { vec3 } from 'gl-matrix';
import { singleton } from 'tsyringe';

import { ISetting } from '../../interfaces/ISetting';
import { BooleanSetting } from '../types/BooleanSetting';
import { CustomSetting } from '../types/CustomSetting';
import { NumberSetting } from '../types/NumberSetting';

@singleton()
export class OrthographicControlsSettings {
    // #region Properties (9)

    private _damping: ISetting<number> = new NumberSetting(0.1, 'How much to damp camera movements by the user', (value: number) => value > 0);
    private _enableKeyPan: ISetting<boolean> = new BooleanSetting(false, 'Enable / disable panning using the keyboard, also refer to enablePan');
    private _enablePan: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable panning in general, also refer to enableKeyPan');
    private _enableZoom: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable zooming');
    private _input: ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }> = new CustomSetting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
    private _keyPanSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of panning when using the keyboard', (value: number) => value > 0);
    private _movementSmoothness: ISetting<number> = new NumberSetting(0.5, 'How much to the current movement is affected by the previous one', (value: number) => value > 0 && value < 1);
    private _panSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of panning', (value: number) => value > 0);
    private _zoomSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of zooming', (value: number) => value > 0);

    // #endregion Properties (9)

    // #region Public Accessors (18)

    /**
     * Getter damping
     * @return {ISetting<number>}
     */
    public get damping(): ISetting<number> {
		return this._damping;
	}

    /**
     * Setter damping
     * @param {ISetting<number>} value
     */
    public set damping(value: ISetting<number>) {
		this._damping = value;
	}

    /**
     * Getter enableKeyPan
     * @return {ISetting<boolean>}
     */
    public get enableKeyPan(): ISetting<boolean> {
		return this._enableKeyPan;
	}

    /**
     * Setter enableKeyPan
     * @param {ISetting<boolean>} value
     */
    public set enableKeyPan(value: ISetting<boolean>) {
		this._enableKeyPan = value;
	}

    /**
     * Getter enablePan
     * @return {ISetting<boolean>}
     */
    public get enablePan(): ISetting<boolean> {
		return this._enablePan;
	}

    /**
     * Setter enablePan
     * @param {ISetting<boolean>} value
     */
    public set enablePan(value: ISetting<boolean>) {
		this._enablePan = value;
	}

    /**
     * Getter enableZoom
     * @return {ISetting<boolean>}
     */
    public get enableZoom(): ISetting<boolean> {
		return this._enableZoom;
	}

    /**
     * Setter enableZoom
     * @param {ISetting<boolean>} value
     */
    public set enableZoom(value: ISetting<boolean>) {
		this._enableZoom = value;
	}

    /**
     * Getter input
     * @return {ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }>}
     */
    public get input(): ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }> {
		return this._input;
	}

    /**
     * Setter input
     * @param {ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }>} value
     */
    public set input(value: ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }>) {
		this._input = value;
	}

    /**
     * Getter keyPanSpeed
     * @return {ISetting<number>}
     */
    public get keyPanSpeed(): ISetting<number> {
		return this._keyPanSpeed;
	}

    /**
     * Setter keyPanSpeed
     * @param {ISetting<number>} value
     */
    public set keyPanSpeed(value: ISetting<number>) {
		this._keyPanSpeed = value;
	}

    /**
     * Getter movementSmoothness
     * @return {ISetting<number>}
     */
    public get movementSmoothness(): ISetting<number> {
		return this._movementSmoothness;
	}

    /**
     * Setter movementSmoothness
     * @param {ISetting<number>} value
     */
    public set movementSmoothness(value: ISetting<number>) {
		this._movementSmoothness = value;
	}

    /**
     * Getter panSpeed
     * @return {ISetting<number>}
     */
    public get panSpeed(): ISetting<number> {
		return this._panSpeed;
	}

    /**
     * Setter panSpeed
     * @param {ISetting<number>} value
     */
    public set panSpeed(value: ISetting<number>) {
		this._panSpeed = value;
	}

    /**
     * Getter zoomSpeed
     * @return {ISetting<number>}
     */
    public get zoomSpeed(): ISetting<number> {
		return this._zoomSpeed;
	}

    /**
     * Setter zoomSpeed
     * @param {ISetting<number>} value
     */
    public set zoomSpeed(value: ISetting<number>) {
		this._zoomSpeed = value;
	}

    // #endregion Public Accessors (18)
}