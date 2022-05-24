import { IOrbitControlsSettingsV3 } from '@shapediver/viewer.settings'
import { SettingsEngine, StateEngine, Converter } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { CAMERA_TYPE, ICamera } from '../..'
import { IPerspectiveCameraControls } from '../../interfaces/controls/IPerspectiveCameraControls'
import { AbstractCameraControls } from './AbstractCameraControls'
import {
  CameraControlsEventDistribution as OrbitCameraControlsEventDistribution,
} from './perspective/CameraControlsEventDistribution'
import { CameraControlsLogic as OrbitCameraControlsLogic } from './perspective/CameraControlsLogic'

export class PerspectiveCameraControls extends AbstractCameraControls implements IPerspectiveCameraControls {
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
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (19)

    // #region Constructors (1)

    constructor(camera: ICamera, enabled: boolean) {
        super(camera, enabled, CAMERA_TYPE.PERSPECTIVE);
        this._cameraLogic = new OrbitCameraControlsLogic(this);
        this._cameraControlsEventDistribution = new OrbitCameraControlsEventDistribution(this, <OrbitCameraControlsLogic>this._cameraLogic);
    }

    public applySettings(settingsEngine: SettingsEngine) {
        const cameraSetting = settingsEngine.camera.cameras[this.camera.id];
        if(!cameraSetting) return;
        this.reset();
        const controlsSettings = <IOrbitControlsSettingsV3>cameraSetting.controls;
        this.autoRotationSpeed = controlsSettings.autoRotationSpeed;
        this.damping = controlsSettings.damping;
        this.enableAutoRotation = controlsSettings.enableAutoRotation;
        this.enableKeyPan = controlsSettings.enableKeyPan;
        this.enablePan = controlsSettings.enablePan;
        this.enableRotation = controlsSettings.enableRotation;
        this.enableZoom = controlsSettings.enableZoom;
        this.input = controlsSettings.input;
        this.keyPanSpeed = controlsSettings.keyPanSpeed;
        this.movementSmoothness = controlsSettings.movementSmoothness;
        this.rotationSpeed = controlsSettings.rotationSpeed;
        this.panSpeed = controlsSettings.panSpeed;
        this.zoomSpeed = controlsSettings.zoomSpeed;

        if(controlsSettings.restrictions.position.cube.min.x === null) controlsSettings.restrictions.position.cube.min.x = -Infinity;
        if(controlsSettings.restrictions.position.cube.min.y === null) controlsSettings.restrictions.position.cube.min.y = -Infinity;
        if(controlsSettings.restrictions.position.cube.min.z === null) controlsSettings.restrictions.position.cube.min.z = -Infinity;
        if(controlsSettings.restrictions.position.cube.max.x === null) controlsSettings.restrictions.position.cube.max.x = Infinity;
        if(controlsSettings.restrictions.position.cube.max.y === null) controlsSettings.restrictions.position.cube.max.y = Infinity;
        if(controlsSettings.restrictions.position.cube.max.z === null) controlsSettings.restrictions.position.cube.max.z = Infinity;
        if(controlsSettings.restrictions.position.sphere.radius === null) controlsSettings.restrictions.position.sphere.radius = Infinity;
        if(controlsSettings.restrictions.target.cube.min.x === null) controlsSettings.restrictions.target.cube.min.x = -Infinity;
        if(controlsSettings.restrictions.target.cube.min.y === null) controlsSettings.restrictions.target.cube.min.y = -Infinity;
        if(controlsSettings.restrictions.target.cube.min.z === null) controlsSettings.restrictions.target.cube.min.z = -Infinity;
        if(controlsSettings.restrictions.target.cube.max.x === null) controlsSettings.restrictions.target.cube.max.x = Infinity;
        if(controlsSettings.restrictions.target.cube.max.y === null) controlsSettings.restrictions.target.cube.max.y = Infinity;
        if(controlsSettings.restrictions.target.cube.max.z === null) controlsSettings.restrictions.target.cube.max.z = Infinity;
        if(controlsSettings.restrictions.target.sphere.radius === null) controlsSettings.restrictions.target.sphere.radius = Infinity;
        if(controlsSettings.restrictions.rotation.minAzimuthAngle === null) controlsSettings.restrictions.rotation.minAzimuthAngle = -Infinity;
        if(controlsSettings.restrictions.rotation.maxAzimuthAngle === null) controlsSettings.restrictions.rotation.maxAzimuthAngle = Infinity;
        if(controlsSettings.restrictions.zoom.maxDistance === null) controlsSettings.restrictions.zoom.maxDistance = Infinity;

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

    // #endregion Constructors (1)

    // #region Public Accessors (38)

    public get autoRotationSpeed(): number {
        return this._autoRotationSpeed;
    }

    public set autoRotationSpeed(value: number) {
        this._autoRotationSpeed = value;
    }

    public get cubePositionRestriction(): { min: vec3, max: vec3 } {
        return this._cubePositionRestriction;
    }

    public set cubePositionRestriction(value: { min: vec3, max: vec3 }) {
        this._cubePositionRestriction = value;
    }

    public get cubeTargetRestriction(): { min: vec3, max: vec3 } {
        return this._cubeTargetRestriction;
    }

    public set cubeTargetRestriction(value: { min: vec3, max: vec3 }) {
        this._cubeTargetRestriction = value;
    }

    public get damping(): number {
        return this._damping;
    }

    public set damping(value: number) {
        this._damping = value;
    }

    public get enableAutoRotation(): boolean {
        return this._enableAutoRotation;
    }

    public set enableAutoRotation(value: boolean) {
        this._enableAutoRotation = value;
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

    public get enableRotation(): boolean {
        return this._enableRotation;
    }

    public set enableRotation(value: boolean) {
        this._enableRotation = value;
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

    public get rotationRestriction(): { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number } {
        return this._rotationRestriction;
    }

    public set rotationRestriction(value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) {
        this._rotationRestriction = value;
    }

    public get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    public set rotationSpeed(value: number) {
        this._rotationSpeed = value;
    }

    public get spherePositionRestriction(): { center: vec3, radius: number } {
        return this._spherePositionRestriction;
    }

    public set spherePositionRestriction(value: { center: vec3, radius: number }) {
        this._spherePositionRestriction = value;
    }

    public get sphereTargetRestriction(): { center: vec3, radius: number } {
        return this._sphereTargetRestriction;
    }

    public set sphereTargetRestriction(value: { center: vec3, radius: number }) {
        this._sphereTargetRestriction = value;
    }

    public get zoomRestriction(): { minDistance: number, maxDistance: number } {
        return this._zoomRestriction;
    }

    public set zoomRestriction(value: { minDistance: number, maxDistance: number }) {
        this._zoomRestriction = value;
    }

    public get zoomSpeed(): number {
        return this._zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        this._zoomSpeed = value;
    }

    // #endregion Public Accessors (38)
}