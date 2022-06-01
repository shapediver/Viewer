import { vec3, vec2 } from "gl-matrix";
import { IOrthographicCamera, ORTHOGRAPHIC_CAMERA_DIRECTION } from "@shapediver/viewer.rendering-engine.camera-engine";
import { IOrthographicCameraApi } from "../../../interfaces/viewport/camera/IOrthographicCameraApi";
import { AbstractCameraApi } from "./AbstractCameraApi";

export class OrthographicCameraApi extends AbstractCameraApi implements IOrthographicCameraApi {
    // #region Properties (1)

    readonly #camera: IOrthographicCamera;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(camera: IOrthographicCamera) {
        super(camera);
        this.#camera = camera;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

    public get damping(): number {
        return this.#camera.controls.damping;
    }

    public set damping(value: number) {
        this.#camera.controls.damping = value;
    }

    public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
        return this.#camera.direction;
    }

    public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
        this.#camera.direction = value;
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

    public get enableZoom(): boolean {
        return this.#camera.controls.enableZoom;
    }

    public set enableZoom(value: boolean) {
        this.#camera.controls.enableZoom = value;
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

    public get zoomSpeed(): number {
        return this.#camera.controls.zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        this.#camera.controls.zoomSpeed = value;
    }

    // #endregion Public Accessors (18)
}