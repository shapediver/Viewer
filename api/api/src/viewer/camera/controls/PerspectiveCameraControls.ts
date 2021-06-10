import { IPerspectiveCameraControls, PerspectiveCameraControls as PerspectiveCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export class PerspectiveCameraControls implements IPerspectiveCameraControls {
    // #region Properties (23)

    readonly #controls: PerspectiveCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    
    readonly autoRotationSpeed!: number
    readonly cubePositionRestriction!: { min: vec3, max: vec3 };
    readonly cubeTargetRestriction!: { min: vec3, max: vec3 };
    readonly damping!: number
    readonly enableAutoRotation!: boolean
    readonly enableKeyPan!: boolean;
    readonly enablePan!: boolean;
    readonly enableRotation!: boolean;
    readonly enableZoom!: boolean;
    readonly enabled!: boolean;
    readonly input!: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } };
    readonly keyPanSpeed!: number;
    readonly movementSmoothness!: number;
    readonly panSpeed!: number;
    readonly rotationRestriction!: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number };
    readonly rotationSpeed!: number;
    readonly spherePositionRestriction!: { center: vec3, radius: number };
    readonly sphereTargetRestriction!: { center: vec3, radius: number };
    readonly zoomRestriction!: { minDistance: number, maxDistance: number };
    readonly zoomSpeed!: number;
    readonly #updateCB = () => {
        (<any>this.autoRotationSpeed) = this.#controls.autoRotationSpeed;
        (<any>this.cubePositionRestriction) = this.#controls.cubePositionRestriction;
        (<any>this.cubeTargetRestriction) = this.#controls.cubeTargetRestriction;
        (<any>this.damping) = this.#controls.damping;
        (<any>this.enableAutoRotation) = this.#controls.enableAutoRotation;
        (<any>this.enableKeyPan) = this.#controls.enableKeyPan;
        (<any>this.enablePan) = this.#controls.enablePan;
        (<any>this.enableRotation) = this.#controls.enableRotation;
        (<any>this.enableZoom) = this.#controls.enableZoom;
        (<any>this.enabled) = this.#controls.enabled;
        (<any>this.input) = this.#controls.input;
        (<any>this.keyPanSpeed) = this.#controls.keyPanSpeed;
        (<any>this.movementSmoothness) = this.#controls.movementSmoothness;
        (<any>this.panSpeed) = this.#controls.panSpeed;
        (<any>this.rotationRestriction) = this.#controls.rotationRestriction;
        (<any>this.rotationSpeed) = this.#controls.rotationSpeed;
        (<any>this.spherePositionRestriction) = this.#controls.spherePositionRestriction;
        (<any>this.sphereTargetRestriction) = this.#controls.sphereTargetRestriction;
        (<any>this.zoomRestriction) = this.#controls.zoomRestriction;
        (<any>this.zoomSpeed) = this.#controls.zoomSpeed;
    }
    // #endregion Properties (23)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: PerspectiveCameraControlsLogic) {
        this.#controls = controls;
        (<PerspectiveCameraControlsLogic>this.#controls).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    /**
     * Speed of autorotation, can be negative, also refer to enableAutoRotation
     * @param {number} value
     */
    public updateAutoRotationSpeed(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#controls.autoRotationSpeed = value;
        this.#logger.info(`Camera Controls: autoRotationSpeed was set to: ${value}`);
    }

    /**
     * Restriction of the camera position inside a cube, minimum and maximum corner of the cube
     * @param {{ min: vec3, max: vec3 }} value
     */
    public updateCubePositionRestriction(value: { min: vec3, max: vec3 }) {
        this.#inputValidator.validate(value.min, 'vec3');
        this.#inputValidator.validate(value.max, 'vec3');
        this.#controls.cubePositionRestriction = value;
        this.#logger.info(`Camera Controls: cubePositionRestriction was set to: ${value}`);
    }

    /**
     * Restriction of the camera target inside a cube, minimum and maximum corner of the cube
     * @param {{ min: vec3, max: vec3 }} value
     */
    public updateCubeTargetRestriction(value: { min: vec3, max: vec3 }) {
        this.#inputValidator.validate(value.min, 'vec3');
        this.#inputValidator.validate(value.max, 'vec3');
        this.#controls.cubeTargetRestriction = value;
        this.#logger.info(`Camera Controls: cubeTargetRestriction was set to: ${value}`);
    }

    /**
     * The damping of the camera movement
     * @param {number} value
     */
    public updateDamping(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#controls.damping = value;
        this.#logger.info(`Camera Controls: damping was set to: ${value}`);
    }

    /**
     * Enable / Disable automatic rotation of the camera, also refer to autoRotationSpeed
     * @param {boolean} value
     */
    public updateEnableAutoRotation(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableAutoRotation = value;
        this.#logger.info(`Camera Controls: enableAutoRotation was set to: ${value}`);
    }

    /**
     * Enable / Disable panning using the keyboard, also refer to enablePan
     * @param {boolean} value
     */
    public updateEnableKeyPan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableKeyPan = value;
        this.#logger.info(`Camera Controls: enableKeyPan was set to: ${value}`);
    }

    /**
     * Enable / Disable panning in general, also refer to enableKeyPan
     * @param {boolean} value
     */
    public updateEnablePan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enablePan = value;
        this.#logger.info(`Camera Controls: enablePan was set to: ${value}`);
    }

    /**
     * Enable / Disable camera rotation
     * @param {boolean} value
     */
    public updateEnableRotation(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableRotation = value;
        this.#logger.info(`Camera Controls: enableRotation was set to: ${value}`);
    }

    /**
     * Enable / Disable zooming
     * @param {boolean} value
     */
    public updateEnableZoom(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableZoom = value;
        this.#logger.info(`Camera Controls: enableZoom was set to: ${value}`);
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public updateEnabled(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enabled = value;
        this.#logger.info(`Camera Controls: enabled was set to: ${value}`);
    }

    /**
     * The input definition
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public updateInput(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this.#inputValidator.validate(value.keys.down, 'number');
        this.#inputValidator.validate(value.keys.left, 'number');
        this.#inputValidator.validate(value.keys.right, 'number');
        this.#inputValidator.validate(value.keys.up, 'number');        
        this.#inputValidator.validate(value.mouse.pan, 'number');
        this.#inputValidator.validate(value.mouse.rotate, 'number');
        this.#inputValidator.validate(value.mouse.zoom, 'number');
        this.#inputValidator.validate(value.touch.pan, 'number');
        this.#inputValidator.validate(value.touch.rotate, 'number');
        this.#inputValidator.validate(value.touch.zoom, 'number');
        this.#controls.input = value;
        this.#logger.info(`Camera Controls: input was set to: ${value}`);
    }

    /**
     * Speed of panning when using the keyboard
     * @param {number} value
     */
    public updateKeyPanSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.keyPanSpeed = value;
        this.#logger.info(`Camera Controls: keyPanSpeed was set to: ${value}`);
    }

    /**
     * The effect the previous movement has on the next one
     * @param {number} value
     */
    public updateMovementSmoothness(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.movementSmoothness = value;
        this.#logger.info(`Camera Controls: movementSmoothness was set to: ${value}`);
    }

    /**
     * Speed of panning
     * @param {number} value
     */
    public updatePanSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.panSpeed = value;
        this.#logger.info(`Camera Controls: panSpeed was set to: ${value}`);
    }

    /**
     * Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree
     * @param {{ minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }} value
     */
    public updateRotationRestriction(value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) {
        this.#inputValidator.validate(value.minPolarAngle, 'number');
        this.#inputValidator.validate(value.maxPolarAngle, 'number');
        this.#inputValidator.validate(value.minAzimuthAngle, 'number');
        this.#inputValidator.validate(value.maxAzimuthAngle, 'number');
        this.#controls.rotationRestriction = value;
        this.#logger.info(`Camera Controls: rotationRestriction was set to: ${value}`);
    }

    /**
     * Speed of camera rotation
     * @param {number} value
     */
    public updateRotationSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.rotationSpeed = value;
        this.#logger.info(`Camera Controls: rotationSpeed was set to: ${value}`);
    }

    /**
     * Restriction of the camera position inside a sphere, center and radius of the sphere
     * @param {{ center: vec3, radius: number }} value
     */
    public updateSpherePositionRestriction(value: { center: vec3, radius: number }) {
        this.#inputValidator.validate(value.center, 'vec3');
        this.#inputValidator.validate(value.radius, 'positive');
        this.#controls.spherePositionRestriction = value;
        this.#logger.info(`Camera Controls: spherePositionRestriction was set to: ${value}`);
    }

    /**
     * Restriction of the camera target inside a sphere, center and radius of the sphere
     * @param {{ center: vec3, radius: number }} value
     */
    public updateSphereTargetRestriction(value: { center: vec3, radius: number }) {
        this.#inputValidator.validate(value.center, 'vec3');
        this.#inputValidator.validate(value.radius, 'positive');
        this.#controls.sphereTargetRestriction = value;
        this.#logger.info(`Camera Controls: sphereTargetRestriction was set to: ${value}`);
    }

    /**
     * Minimum and maximum distance between camera position and target
     * @param {{ minDistance: number, maxDistance: number }} value
     */
    public updateZoomRestriction(value: { minDistance: number, maxDistance: number }) {
        this.#inputValidator.validate(value.minDistance, 'number');
        this.#inputValidator.validate(value.maxDistance, 'number');
        this.#controls.zoomRestriction = value;
        this.#logger.info(`Camera Controls: zoomRestriction was set to: ${value}`);
    }

    /**
     * Speed of zooming
     * @param {number} value
     */
    public updateZoomSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.zoomSpeed = value;
        this.#logger.info(`Camera Controls: zoomSpeed was set to: ${value}`);
    }

    // #endregion Public Accessors (20)
}