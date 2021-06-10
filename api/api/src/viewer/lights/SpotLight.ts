import { Light } from "./Light";
import { SpotLight as SpotLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class SpotLight extends Light {
    // #region Properties (10)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: SpotLightLogic;
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
    constructor(light: SpotLightLogic) {
        super(light);
        this.#light = light;
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
        this.#inputValidator.validate(value, 'positive');
        this.#light.angle = value;
        this.#logger.info(`Light (${this.#light.id}): angle was set to: ${value}`);
    }

    /**
     * The decay of the light radiance
     * @param {number} value
     */
    public updateDecay(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.decay = value;
        this.#logger.info(`Light (${this.#light.id}): decay was set to: ${value}`);
    }

    /**
     * The distance of the light radiance
     * @param {number} value
     */
    public updateDistance(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.distance = value;
        this.#logger.info(`Light (${this.#light.id}): distance was set to: ${value}`);
    }

    /**
     * The percentage of the cone that is part of the penmubra
     * @param {number} value
     */
    public updatePenumbra(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.penumbra = value;
        this.#logger.info(`Light (${this.#light.id}): penumbra was set to: ${value}`);
    }

    /**
     * The position of the light
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.position = value;
        this.#logger.info(`Light (${this.#light.id}): position was set to: ${value}`);
    }

    /**
     * The target of the light
     * @param {vec3} value
     */
    public updateTarget(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.target = value;
        this.#logger.info(`Light (${this.#light.id}): target was set to: ${value}`);
    }

    // #endregion Public Accessors (6)
}