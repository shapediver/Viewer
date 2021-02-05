import { vec3 } from 'gl-matrix';
import { singleton } from 'tsyringe';

import { ISetting } from '../../interfaces/ISetting';
import { BooleanSetting } from '../types/BooleanSetting';
import { CustomSetting } from '../types/CustomSetting';
import { NumberSetting } from '../types/NumberSetting';

@singleton()
export class OrbitControlsSettings {
    // #region Properties (19)

    private _autoRotationSpeed: ISetting<number> = new NumberSetting(0, 'Speed of autoration, can be negative, also refer to enableAutoRotation');
    private _damping: ISetting<number> = new NumberSetting(0.1, 'How much to damp camera movements by the user', (value: number) => value > 0);
    private _enableAutoRotation: ISetting<boolean> = new BooleanSetting(false, 'Enable / disable automatic rotation of the camera, also refer to autoRotationSpeed');
    private _enableKeyPan: ISetting<boolean> = new BooleanSetting(false, 'Enable / disable panning using the keyboard, also refer to enablePan');
    private _enablePan: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable panning in general, also refer to enableKeyPan');
    private _enableRotation: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable camera rotation');
    private _enableZoom: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable zooming');
    private _input: ISetting<{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }> = new CustomSetting({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
    private _keyPanSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of panning when using the keyboard', (value: number) => value > 0);
    private _movementSmoothness: ISetting<number> = new NumberSetting(0.5, 'How much to the current movement is affected by the previous one', (value: number) => value > 0 && value < 1);
    private _panSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of panning', (value: number) => value > 0);
    private _restrictionPositionCube: ISetting<{min: vec3, max: vec3}> = new CustomSetting({ min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) }, 'Restriction of the camera position inside a cube, minimum and maximum corner of the cube');
    private _restrictionPositionSphere: ISetting<{center: vec3, radius: number}> = new CustomSetting({ center: vec3.create(), radius: Infinity }, 'Restriction of the camera position inside a sphere, center and radius of the sphere');
    private _restrictionRotation: ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}> = new CustomSetting({ minPolarAngle: 0, maxPolarAngle: 180, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity }, 'Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree');
    private _restrictionTargetCube: ISetting<{min: vec3, max: vec3}> = new CustomSetting({ min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) }, 'Restriction of the camera target inside a cube, minimum and maximum corner of the cube');
    private _restrictionTargetSphere: ISetting<{center: vec3, radius: number}> = new CustomSetting({ center: vec3.create(), radius: Infinity }, 'Restriction of the camera target inside a sphere, center and radius of the sphere');
    private _restrictionZoom: ISetting<{minDistance: number, maxDistance: number}> = new CustomSetting({ minDistance: 0, maxDistance: Infinity }, 'Minimum and maximum distance between camera position and target');
    private _rotationSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of camera rotation', (value: number) => value > 0);
    private _zoomSpeed: ISetting<number> = new NumberSetting(0.5, 'Speed of zooming', (value: number) => value > 0);

    // #endregion Properties (19)

    // #region Public Accessors (38)

    /**
     * Getter autoRotationSpeed
     * @return {ISetting<number>}
     */
    public get autoRotationSpeed(): ISetting<number> {
        return this._autoRotationSpeed;
    }

    /**
     * Setter autoRotationSpeed
     * @param {ISetting<number>} value
     */
    public set autoRotationSpeed(value: ISetting<number>) {
        this._autoRotationSpeed = value;
    }

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
     * Getter enableAutoRotation
     * @return {ISetting<boolean>}
     */
    public get enableAutoRotation(): ISetting<boolean> {
        return this._enableAutoRotation;
    }

    /**
     * Setter enableAutoRotation
     * @param {ISetting<boolean>} value
     */
    public set enableAutoRotation(value: ISetting<boolean>) {
        this._enableAutoRotation = value;
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
     * Getter enableRotation
     * @return {ISetting<boolean>}
     */
    public get enableRotation(): ISetting<boolean> {
        return this._enableRotation;
    }

    /**
     * Setter enableRotation
     * @param {ISetting<boolean>} value
     */
    public set enableRotation(value: ISetting<boolean>) {
        this._enableRotation = value;
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
     * Getter restrictionPositionCube
     * @return {ISetting<{min: vec3, max: vec3}>}
     */
    public get restrictionPositionCube(): ISetting<{min: vec3, max: vec3}> {
        return this._restrictionPositionCube;
    }

    /**
     * Setter restrictionPositionCube
     * @param {ISetting<{min: vec3, max: vec3}>} value
     */
    public set restrictionPositionCube(value: ISetting<{min: vec3, max: vec3}>) {
        this._restrictionPositionCube = value;
    }

    /**
     * Getter restrictionPositionSphere
     * @return {ISetting<{center: vec3, radius: number}>}
     */
    public get restrictionPositionSphere(): ISetting<{center: vec3, radius: number}> {
        return this._restrictionPositionSphere;
    }

    /**
     * Setter restrictionPositionSphere
     * @param {ISetting<{center: vec3, radius: number}>} value
     */
    public set restrictionPositionSphere(value: ISetting<{center: vec3, radius: number}>) {
        this._restrictionPositionSphere = value;
    }

    /**
     * Getter restrictionRotation
     * @return {ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}>}
     */
    public get restrictionRotation(): ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}> {
        return this._restrictionRotation;
    }

    /**
     * Setter restrictionRotation
     * @param {ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}>} value
     */
    public set restrictionRotation(value: ISetting<{minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number}>) {
        this._restrictionRotation = value;
    }

    /**
     * Getter restrictionTargetCube
     * @return {ISetting<{min: vec3, max: vec3}>}
     */
    public get restrictionTargetCube(): ISetting<{min: vec3, max: vec3}> {
        return this._restrictionTargetCube;
    }

    /**
     * Setter restrictionTargetCube
     * @param {ISetting<{min: vec3, max: vec3}>} value
     */
    public set restrictionTargetCube(value: ISetting<{min: vec3, max: vec3}>) {
        this._restrictionTargetCube = value;
    }

    /**
     * Getter restrictionTargetSphere
     * @return {ISetting<{center: vec3, radius: number}>}
     */
    public get restrictionTargetSphere(): ISetting<{center: vec3, radius: number}> {
        return this._restrictionTargetSphere;
    }

    /**
     * Setter restrictionTargetSphere
     * @param {ISetting<{center: vec3, radius: number}>} value
     */
    public set restrictionTargetSphere(value: ISetting<{center: vec3, radius: number}>) {
        this._restrictionTargetSphere = value;
    }

    /**
     * Getter restrictionZoom
     * @return {ISetting<{minDistance: number, maxDistance: number}>}
     */
    public get restrictionZoom(): ISetting<{minDistance: number, maxDistance: number}> {
        return this._restrictionZoom;
    }

    /**
     * Setter restrictionZoom
     * @param {ISetting<{minDistance: number, maxDistance: number}>} value
     */
    public set restrictionZoom(value: ISetting<{minDistance: number, maxDistance: number}>) {
        this._restrictionZoom = value;
    }

    /**
     * Getter rotationSpeed
     * @return {ISetting<number>}
     */
    public get rotationSpeed(): ISetting<number> {
        return this._rotationSpeed;
    }

    /**
     * Setter rotationSpeed
     * @param {ISetting<number>} value
     */
    public set rotationSpeed(value: ISetting<number>) {
        this._rotationSpeed = value;
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

    // #endregion Public Accessors (38)
}