import { vec3, vec2 } from "gl-matrix";
import { CAMERA_TYPE, IBox } from "../../..";
import { ICamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { ICameraApi } from "../../../interfaces/viewport/camera/ICameraApi";

export abstract class AbstractCameraApi implements ICameraApi {
    // #region Properties (15)

    readonly #camera: ICamera;

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(camera: ICamera) {
        this.#camera = camera;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (28)

    public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    public set autoAdjust(value: boolean) {
        this.#camera.autoAdjust = value;
    }

    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    public set cameraMovementDuration(value: number) {
        this.#camera.cameraMovementDuration = value;
    }

    public get defaultPosition(): vec3 {
        return this.#camera.defaultPosition;
    }

    public set defaultPosition(value: vec3) {
        this.#camera.defaultPosition = value;
    }

    public get defaultTarget(): vec3 {
        return this.#camera.defaultTarget;
    }

    public set defaultTarget(value: vec3) {
        this.#camera.defaultTarget = value;
    }

    public get enabled(): boolean {
        return this.#camera.controls.enabled;
    }

    public set enabled(value: boolean) {
        this.#camera.controls.enabled = value;
    }

    public get id(): string {
        return this.#camera.id;
    }

    public get name(): string | undefined {
        return this.#camera.name;
    }

    public set name(value: string | undefined) {
        this.#camera.name = value;
    }

    public get order(): number | undefined {
        return this.#camera.order;
    }

    public set order(value: number | undefined) {
        this.#camera.order = value;
    }

    public get position(): vec3 {
        return this.#camera.position;
    }

    public set position(value: vec3) {
        this.#camera.position = value;
    }

    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    public set revertAtMouseUp(value: boolean) {
        this.#camera.revertAtMouseUp = value;
    }

    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    public set revertAtMouseUpDuration(value: number) {
        this.#camera.revertAtMouseUpDuration = value;
    }

    public get target(): vec3 {
        return this.#camera.target;
    }

    public set target(value: vec3) {
        this.#camera.target = value;
    }

    public get type(): CAMERA_TYPE {
        return this.#camera.type;
    }

    public get zoomToFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    public set zoomToFactor(value: number) {
        this.#camera.zoomExtentsFactor = value;
    }

    // #endregion Public Accessors (28)

    // #region Public Methods (7)

    public animate(path: { position: vec3; target: vec3; }[], options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        return this.#camera.animate(path, options);
    }

    public calculateZoomTo(zoomTarget?: IBox, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; } {
        return this.#camera.calculateZoomTo(zoomTarget, startingPosition, startingTarget);
    }

    public project(p: vec3): vec2 {
        return this.#camera.project(p);
    }

    public reset(options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        return this.#camera.reset(options);
    }

    public set(position: vec3, target: vec3, options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        return this.#camera.set(position, target, options);
    }

    public unproject(p: vec3): vec3 {
        return this.#camera.unproject(p);
    }

    public zoomTo(zoomTarget?: IBox, options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        return this.#camera.zoomTo(zoomTarget, options);
    }

    // #endregion Public Methods (7)
}