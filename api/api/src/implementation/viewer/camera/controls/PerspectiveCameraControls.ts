import {
  PerspectiveCameraControls as PerspectiveCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { IPerspectiveCameraControls } from '../../../../interfaces/viewer/camera/controls/IPerspectiveCameraControls'
import { IViewer } from '../../../../interfaces/viewer/IViewer'

export class PerspectiveCameraControls implements IPerspectiveCameraControls {
    // #region Properties (4)

    readonly #controls: PerspectiveCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: PerspectiveCameraControlsLogic, viewer: IViewer) {
        try {
            this.#controls = controls;
            this.#viewer = viewer;
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).constructor: PerspectiveCameraControlsLogic api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls.constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (40)

    /**
     * Getter autoRotationSpeed
     */
    public get autoRotationSpeed(): number {
        return this.#controls.autoRotationSpeed;
    }

    /**
     * Setter autoRotationSpeed
     */
    public set autoRotationSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).autoRotationSpeed: Updating AutoRotationSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).autoRotationSpeed`, value, 'number');
            this.#controls.autoRotationSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).autoRotationSpeed: autoRotationSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).autoRotationSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter cubePositionRestriction
     */
    public get cubePositionRestriction(): { min: vec3, max: vec3 } {
        return this.#controls.cubePositionRestriction;
    }

    /**
     * Setter cubePositionRestriction
     */
    public set cubePositionRestriction(value: { min: vec3, max: vec3 }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubePositionRestriction: Updating CubePositionRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubePositionRestriction`, value.min, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubePositionRestriction`, value.max, 'vec3');
            this.#controls.cubePositionRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubePositionRestriction: cubePositionRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).cubePositionRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter cubeTargetRestriction
     */
    public get cubeTargetRestriction(): { min: vec3, max: vec3 } {
        return this.#controls.cubeTargetRestriction;
    }

    /**
     * Setter cubeTargetRestriction
     */
    public set cubeTargetRestriction(value: { min: vec3, max: vec3 }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubeTargetRestriction: Updating CubeTargetRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubeTargetRestriction`, value.min, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubeTargetRestriction`, value.max, 'vec3');
            this.#controls.cubeTargetRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).cubeTargetRestriction: cubeTargetRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).cubeTargetRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter damping
     */
    public get damping(): number {
        return this.#controls.damping;
    }

    /**
     * Setter damping
     */
    public set damping(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).damping: Updating Damping to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).damping`, value, 'positive');
            this.#controls.damping = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).damping: damping was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).damping: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableAutoRotation
     */
    public get enableAutoRotation(): boolean {
        return this.#controls.enableAutoRotation;
    }

    /**
     * Setter enableAutoRotation
     */
    public set enableAutoRotation(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableAutoRotation: Updating EnableAutoRotation to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableAutoRotation`, value, 'boolean');
            this.#controls.enableAutoRotation = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableAutoRotation: enableAutoRotation was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableAutoRotation: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableKeyPan
     */
    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    /**
     * Setter enableKeyPan
     */
    public set enableKeyPan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: Updating EnableKeyPan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan`, value, 'boolean');
            this.#controls.enableKeyPan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: enableKeyPan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableKeyPan: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enablePan
     */
    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    /**
     * Setter enablePan
     */
    public set enablePan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan: Updating EnablePan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan`, value, 'boolean');
            this.#controls.enablePan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan: enablePan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enablePan: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableRotation
     */
    public get enableRotation(): boolean {
        return this.#controls.enableRotation;
    }

    /**
     * Setter enableRotation
     */
    public set enableRotation(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableRotation: Updating EnableRotation to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableRotation`, value, 'boolean');
            this.#controls.enableRotation = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableRotation: enableRotation was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableRotation: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableZoom
     */
    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    /**
     * Setter enableZoom
     */
    public set enableZoom(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom: Updating EnableZoom to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom`, value, 'boolean');
            this.#controls.enableZoom = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom: enableZoom was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableZoom: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enabled
     */
    public get enabled(): boolean {
        return this.#controls.enabled;
    }

    /**
     * Setter enabled
     */
    public set enabled(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled: Updating Enabled to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled`, value, 'boolean');
            this.#controls.enabled = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled: enabled was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enabled: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter input
     */
    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this.#controls.input;
    }

    /**
     * Setter input
     */
    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input: Updating Input to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.down, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.left, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.right, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.up, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.zoom, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.zoom, 'number');
            this.#controls.input = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input: input was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).input: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter keyPanSpeed
     */
    public get keyPanSpeed(): number {
        return this.#controls.keyPanSpeed;
    }

    /**
     * Setter keyPanSpeed
     */
    public set keyPanSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: Updating KeyPanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed`, value, 'factor');
            this.#controls.keyPanSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: keyPanSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).keyPanSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter movementSmoothness
     */
    public get movementSmoothness(): number {
        return this.#controls.movementSmoothness;
    }

    /**
     * Setter movementSmoothness
     */
    public set movementSmoothness(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: Updating MovementSmoothness to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness`, value, 'factor');
            this.#controls.movementSmoothness = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: movementSmoothness was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).movementSmoothness: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter panSpeed
     */
    public get panSpeed(): number {
        return this.#controls.panSpeed;
    }

    /**
     * Setter panSpeed
     */
    public set panSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed: Updating PanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed`, value, 'factor');
            this.#controls.panSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed: panSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).panSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter rotationRestriction
     */
    public get rotationRestriction(): { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number } {
        return this.#controls.rotationRestriction;
    }

    /**
     * Setter rotationRestriction
     */
    public set rotationRestriction(value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction: Updating RotationRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction`, value.minPolarAngle, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction`, value.maxPolarAngle, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction`, value.minAzimuthAngle, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction`, value.maxAzimuthAngle, 'number');
            this.#controls.rotationRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationRestriction: rotationRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).rotationRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter rotationSpeed
     */
    public get rotationSpeed(): number {
        return this.#controls.rotationSpeed;
    }

    /**
     * Setter rotationSpeed
     */
    public set rotationSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationSpeed: Updating RotationSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationSpeed`, value, 'factor');
            this.#controls.rotationSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).rotationSpeed: rotationSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).rotationSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter spherePositionRestriction
     */
    public get spherePositionRestriction(): { center: vec3, radius: number } {
        return this.#controls.spherePositionRestriction;
    }

    /**
     * Setter spherePositionRestriction
     */
    public set spherePositionRestriction(value: { center: vec3, radius: number }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).spherePositionRestriction: Updating SpherePositionRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).spherePositionRestriction`, value.center, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).spherePositionRestriction`, value.radius, 'positive');
            this.#controls.spherePositionRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).spherePositionRestriction: spherePositionRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).spherePositionRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter sphereTargetRestriction
     */
    public get sphereTargetRestriction(): { center: vec3, radius: number } {
        return this.#controls.sphereTargetRestriction;
    }

    /**
     * Setter sphereTargetRestriction
     */
    public set sphereTargetRestriction(value: { center: vec3, radius: number }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).sphereTargetRestriction: Updating SphereTargetRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).sphereTargetRestriction`, value.center, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).sphereTargetRestriction`, value.radius, 'positive');
            this.#controls.sphereTargetRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).sphereTargetRestriction: sphereTargetRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).sphereTargetRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter zoomRestriction
     */
    public get zoomRestriction(): { minDistance: number, maxDistance: number } {
        return this.#controls.zoomRestriction;
    }

    /**
     * Setter zoomRestriction
     */
    public set zoomRestriction(value: { minDistance: number, maxDistance: number }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomRestriction: Updating ZoomRestriction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomRestriction`, value.minDistance, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomRestriction`, value.maxDistance, 'number');
            this.#controls.zoomRestriction = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomRestriction: zoomRestriction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).zoomRestriction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter zoomSpeed
     */
    public get zoomSpeed(): number {
        return this.#controls.zoomSpeed;
    }

    /**
     * Setter zoomSpeed
     */
    public set zoomSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: Updating ZoomSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed`, value, 'factor');
            this.#controls.zoomSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: zoomSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).zoomSpeed: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (40)
}