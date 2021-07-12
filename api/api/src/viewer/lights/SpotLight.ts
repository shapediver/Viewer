import { Light } from "./Light";
import { SpotLight as SpotLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator, SDError } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.utils";
import { Viewer } from "../Viewer";

export class SpotLight extends Light {
    // #region Properties (10)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: SpotLightLogic;
    readonly #viewer: Viewer;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.angle) = this.#light.angle;
        (<any>this.decay) = this.#light.decay;
        (<any>this.distance) = this.#light.distance;
        (<any>this.penumbra) = this.#light.penumbra;
        (<any>this.position) = this.#light.position;
        (<any>this.target) = this.#light.target;
    }

    readonly angle!: number;
    readonly decay!: number;
    readonly distance!: number;
    readonly penumbra!: number;
    readonly position!: vec3;
    readonly target!: vec3;

    // #endregion Properties (10)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: SpotLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
        (<SpotLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    /**
     * The angle of the light cone
     * @param {number} value
     */
    public updateAngle(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateAngle: Updating Angle to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateAngle`, value, 'positive');
            this.#light.angle = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateAngle: angle was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updateAngle: Something unexpected happened.`, true)
        }
    }

    /**
     * The decay of the light radiance
     * @param {number} value
     */
    public updateDecay(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay: Updating Decay to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay`, value, 'positive');
            this.#light.decay = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay: decay was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updateDecay: Something unexpected happened.`, true)
        }
    }

    /**
     * The distance of the light radiance
     * @param {number} value
     */
    public updateDistance(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance: Updating Distance to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance`, value, 'positive');
            this.#light.distance = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance: distance was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updateDistance: Something unexpected happened.`, true)
        }
    }

    /**
     * The percentage of the cone that is part of the penmubra
     * @param {number} value
     */
    public updatePenumbra(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePenumbra: Updating Penumbra to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePenumbra`, value, 'positive');
            this.#light.penumbra = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePenumbra: penumbra was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updatePenumbra: Something unexpected happened.`, true)
        }
    }

    /**
     * The position of the light
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition`, value, 'vec3');
            this.#light.position = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updatePosition: Something unexpected happened.`, true)
        }
    }

    /**
     * The target of the light
     * @param {vec3} value
     */
    public updateTarget(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateTarget: Updating Target to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateTarget`, value, 'vec3');
            this.#light.target = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateTarget: target was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `Light(${this.id}).updateTarget: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (6)
}