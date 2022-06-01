import { vec3, vec2 } from "gl-matrix";
import { IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { IPerspectiveCameraApi } from "../../../interfaces/viewport/camera/IPerspectiveCameraApi";
import { AbstractCameraApi } from "./AbstractCameraApi";

export class PerspectiveCameraApi extends AbstractCameraApi implements IPerspectiveCameraApi {
    // #region Properties (1)

    readonly #camera: IPerspectiveCamera;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(camera: IPerspectiveCamera) {
        super(camera);
        this.#camera = camera;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (38)

    public get autoRotationSpeed(): number {
        return this.#camera.controls.autoRotationSpeed;
    }

    public set autoRotationSpeed(value: number) {
        this.#camera.controls.autoRotationSpeed = value;
    }

    public get cubePositionRestriction(): { min: vec3; max: vec3; } {
        return this.#camera.controls.cubePositionRestriction;
    }

    public set cubePositionRestriction(value: { min: vec3; max: vec3; }) {
        this.#camera.controls.cubePositionRestriction = value;
    }

    public get cubeTargetRestriction(): { min: vec3; max: vec3; } {
        return this.#camera.controls.cubeTargetRestriction;
    }

    public set cubeTargetRestriction(value: { min: vec3; max: vec3; }) {
        this.#camera.controls.cubeTargetRestriction = value;
    }

    public get damping(): number {
        return this.#camera.controls.damping;
    }

    public set damping(value: number) {
        this.#camera.controls.damping = value;
    }

    public get enableAutoRotation(): boolean {
        return this.#camera.controls.enableAutoRotation;
    }

    public set enableAutoRotation(value: boolean) {
        this.#camera.controls.enableAutoRotation = value;
    }

    public get enableKeyPan(): boolean {
        return this.#camera.controls.enableKeyPan;
    }

    public set enableKeyPan(value: boolean) {
        this.#camera.controls.enableKeyPan = value;
    }

    public get enablePan(): boolean {
        return this.#camera.controls.enablePan;
    }

    public set enablePan(value: boolean) {
        this.#camera.controls.enablePan = value;
    }

    public get enableRotation(): boolean {
        return this.#camera.controls.enableRotation;
    }

    public set enableRotation(value: boolean) {
        this.#camera.controls.enableRotation = value;
    }

    public get enableZoom(): boolean {
        return this.#camera.controls.enableZoom;
    }

    public set enableZoom(value: boolean) {
        this.#camera.controls.enableZoom = value;
    }

    public get fov(): number {
        return this.#camera.fov;
    }

    public set fov(value: number) {
        this.#camera.fov = value;
    }

    public get keyPanSpeed(): number {
        return this.#camera.controls.keyPanSpeed;
    }

    public set keyPanSpeed(value: number) {
        this.#camera.controls.keyPanSpeed = value;
    }

    public get movementSmoothness(): number {
        return this.#camera.controls.movementSmoothness;
    }

    public set movementSmoothness(value: number) {
        this.#camera.controls.movementSmoothness = value;
    }

    public get panSpeed(): number {
        return this.#camera.controls.panSpeed;
    }

    public set panSpeed(value: number) {
        this.#camera.controls.panSpeed = value;
    }

    public get rotationRestriction(): { minPolarAngle: number; maxPolarAngle: number; minAzimuthAngle: number; maxAzimuthAngle: number; } {
        return this.#camera.controls.rotationRestriction;
    }

    public set rotationRestriction(value: { minPolarAngle: number; maxPolarAngle: number; minAzimuthAngle: number; maxAzimuthAngle: number; }) {
        this.#camera.controls.rotationRestriction = value;
    }

    public get rotationSpeed(): number {
        return this.#camera.controls.rotationSpeed;
    }

    public set rotationSpeed(value: number) {
        this.#camera.controls.rotationSpeed = value;
    }

    public get spherePositionRestriction(): { center: vec3; radius: number; } {
        return this.#camera.controls.spherePositionRestriction;
    }

    public set spherePositionRestriction(value: { center: vec3; radius: number; }) {
        this.#camera.controls.spherePositionRestriction = value;
    }

    public get sphereTargetRestriction(): { center: vec3; radius: number; } {
        return this.#camera.controls.sphereTargetRestriction;
    }

    public set sphereTargetRestriction(value: { center: vec3; radius: number; }) {
        this.#camera.controls.sphereTargetRestriction = value;
    }

    public get zoomRestriction(): { minDistance: number; maxDistance: number; } {
        return this.#camera.controls.zoomRestriction;
    }

    public set zoomRestriction(value: { minDistance: number; maxDistance: number; }) {
        this.#camera.controls.zoomRestriction = value;
    }

    public get zoomSpeed(): number {
        return this.#camera.controls.zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        this.#camera.controls.zoomSpeed = value;
    }

    // #endregion Public Accessors (38)
}