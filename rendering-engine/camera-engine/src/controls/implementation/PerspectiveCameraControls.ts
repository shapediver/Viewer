import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";
import { CAMERATYPE, ICamera } from "../..";
import { AbstractCameraControls } from "./AbstractCameraControls";

import { CameraControlsEventDistribution as OrbitCameraControlsEventDistribution } from './orbit/CameraControlsEventDistribution';
import { CameraControlsLogic as OrbitCameraControlsLogic } from './orbit/CameraControlsLogic';

export class PerspectiveCameraControls extends AbstractCameraControls {
    // #region Properties (19)

    private _autoRotationSpeed: number = 0;
    private _cubePositionRestriction: { min: vec3, max: vec3 } = { min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) };
    private _cubeTargetRestriction: { min: vec3, max: vec3 } = { min: vec3.fromValues(-Infinity, -Infinity, -Infinity), max: vec3.fromValues(Infinity, Infinity, Infinity) };
    private _damping: number = 0.1;
    private _enableAutoRotation: boolean = false;
    private _enableKeyPan: boolean = false;
    private _enablePan: boolean = true;
    private _enableRotation: boolean = true;
    private _enableZoom: boolean = true;
    private _input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } = { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, };
    private _keyPanSpeed: number = 0.5;
    private _movementSmoothness: number = 0.5;
    private _panSpeed: number = 0.5;
    private _rotationRestriction: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number } = { minPolarAngle: 0, maxPolarAngle: 180, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity };
    private _rotationSpeed: number = 0.5;
    private _spherePositionRestriction: { center: vec3, radius: number } = { center: vec3.create(), radius: Infinity };
    private _sphereTargetRestriction: { center: vec3, radius: number } = { center: vec3.create(), radius: Infinity };
    private _zoomRestriction: { minDistance: number, maxDistance: number } = { minDistance: 0, maxDistance: Infinity };
    private _zoomSpeed: number = 0.5;
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (19)

    // #region Constructors (1)

    constructor(camera: ICamera, canvas: HTMLCanvasElement, enabled: boolean) {
        super(camera, canvas, enabled, CAMERATYPE.PERSPECTIVE);
        this._cameraLogic = new OrbitCameraControlsLogic(this);
        this._cameraControlsEventDistribution = new OrbitCameraControlsEventDistribution(this, <OrbitCameraControlsLogic>this._cameraLogic);
        this._stateEngine.firstSettingsRegistered.then(() => this.applySettings());
    }

    private applySettings() {
        this.autoRotationSpeed = this._settingsEngine.cameraOrbitControls.autoRotationSpeed.value;
        this.damping = this._settingsEngine.cameraOrbitControls.damping.value;
        this.enableAutoRotation = this._settingsEngine.cameraOrbitControls.enableAutoRotation.value;
        this.enableKeyPan = this._settingsEngine.cameraOrbitControls.enableKeyPan.value;
        this.enablePan = this._settingsEngine.cameraOrbitControls.enablePan.value;
        this.enableRotation = this._settingsEngine.cameraOrbitControls.enableRotation.value;
        this.enableZoom = this._settingsEngine.cameraOrbitControls.enableZoom.value;
        this.input = this._settingsEngine.cameraOrbitControls.input.value;
        this.keyPanSpeed = this._settingsEngine.cameraOrbitControls.keyPanSpeed.value;
        this.movementSmoothness = this._settingsEngine.cameraOrbitControls.movementSmoothness.value;
        this.rotationSpeed = this._settingsEngine.cameraOrbitControls.rotationSpeed.value;
        this.panSpeed = this._settingsEngine.cameraOrbitControls.panSpeed.value;
        this.zoomSpeed = this._settingsEngine.cameraOrbitControls.zoomSpeed.value;

        this.cubePositionRestriction = this._settingsEngine.cameraOrbitControls.restrictions.position.cube.value;
        this.spherePositionRestriction = this._settingsEngine.cameraOrbitControls.restrictions.position.sphere.value;
        this.cubeTargetRestriction = this._settingsEngine.cameraOrbitControls.restrictions.target.cube.value;
        this.sphereTargetRestriction = this._settingsEngine.cameraOrbitControls.restrictions.target.sphere.value;
        this.rotationRestriction = this._settingsEngine.cameraOrbitControls.restrictions.rotation.value;
        this.zoomRestriction = this._settingsEngine.cameraOrbitControls.restrictions.zoom.value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (38)

    /**
     * Getter autoRotationSpeed
     * @return {number}
     */
    public get autoRotationSpeed(): number {
        return this._autoRotationSpeed;
    }

    /**
     * Setter autoRotationSpeed
     * @param {number} value
     */
    public set autoRotationSpeed(value: number) {
        this._autoRotationSpeed = value;
    }

    /**
     * Getter cubePositionRestriction
     * @return {{ min: vec3, max: vec3 }}
     */
    public get cubePositionRestriction(): { min: vec3, max: vec3 } {
        return this._cubePositionRestriction;
    }

    /**
     * Setter cubePositionRestriction
     * @param {{ min: vec3, max: vec3 }} value
     */
    public set cubePositionRestriction(value: { min: vec3, max: vec3 }) {
        this._cubePositionRestriction = value;
    }

    /**
     * Getter cubeTargetRestriction
     * @return {{ min: vec3, max: vec3 }}
     */
    public get cubeTargetRestriction(): { min: vec3, max: vec3 } {
        return this._cubeTargetRestriction;
    }

    /**
     * Setter cubeTargetRestriction
     * @param {{ min: vec3, max: vec3 }} value
     */
    public set cubeTargetRestriction(value: { min: vec3, max: vec3 }) {
        this._cubeTargetRestriction = value;
    }

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
     * Getter enableAutoRotation
     * @return {boolean}
     */
    public get enableAutoRotation(): boolean {
        return this._enableAutoRotation;
    }

    /**
     * Setter enableAutoRotation
     * @param {boolean} value
     */
    public set enableAutoRotation(value: boolean) {
        this._enableAutoRotation = value;
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
     * Getter enableRotation
     * @return {boolean}
     */
    public get enableRotation(): boolean {
        return this._enableRotation;
    }

    /**
     * Setter enableRotation
     * @param {boolean} value
     */
    public set enableRotation(value: boolean) {
        this._enableRotation = value;
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
     * Getter rotationRestriction
     * @return {{ minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }}
     */
    public get rotationRestriction(): { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number } {
        return this._rotationRestriction;
    }

    /**
     * Setter rotationRestriction
     * @param {{ minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }} value
     */
    public set rotationRestriction(value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) {
        this._rotationRestriction = value;
    }

    /**
     * Getter rotationSpeed
     * @return {number}
     */
    public get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    /**
     * Setter rotationSpeed
     * @param {number} value
     */
    public set rotationSpeed(value: number) {
        this._rotationSpeed = value;
    }

    /**
     * Getter spherePositionRestriction
     * @return {{ center: vec3, radius: number }}
     */
    public get spherePositionRestriction(): { center: vec3, radius: number } {
        return this._spherePositionRestriction;
    }

    /**
     * Setter spherePositionRestriction
     * @param {{ center: vec3, radius: number }} value
     */
    public set spherePositionRestriction(value: { center: vec3, radius: number }) {
        this._spherePositionRestriction = value;
    }

    /**
     * Getter sphereTargetRestriction
     * @return {{ center: vec3, radius: number }}
     */
    public get sphereTargetRestriction(): { center: vec3, radius: number } {
        return this._sphereTargetRestriction;
    }

    /**
     * Setter sphereTargetRestriction
     * @param {{ center: vec3, radius: number }} value
     */
    public set sphereTargetRestriction(value: { center: vec3, radius: number }) {
        this._sphereTargetRestriction = value;
    }

    /**
     * Getter zoomRestriction
     * @return {{ minDistance: number, maxDistance: number }}
     */
    public get zoomRestriction(): { minDistance: number, maxDistance: number } {
        return this._zoomRestriction;
    }

    /**
     * Setter zoomRestriction
     * @param {{ minDistance: number, maxDistance: number }} value
     */
    public set zoomRestriction(value: { minDistance: number, maxDistance: number }) {
        this._zoomRestriction = value;
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

    // #endregion Public Accessors (38)
}