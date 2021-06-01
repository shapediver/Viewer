import { Light } from "./Light";
import { SpotLight as SpotLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class SpotLight extends Light {
    // #region Properties (1)

    readonly #light: SpotLightLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: SpotLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * The angle of the light cone
     * @return {number}
     */
    public get angle(): number {
        return this.#light.angle;
    }

    /**
     * The angle of the light cone
     * @param {number} value
     */
    public set angle(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.angle = value;
        this.#logger.info(`Light (${this.#light.id}): angle was set to: ${value}`);
    }

    /**
     * The decay of the light radiance
     * @return {number}
     */
    public get decay(): number {
        return this.#light.decay;
    }

    /**
     * The decay of the light radiance
     * @param {number} value
     */
    public set decay(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.decay = value;
        this.#logger.info(`Light (${this.#light.id}): decay was set to: ${value}`);
    }

    /**
     * The distance of the light radiance
     * @return {number}
     */
    public get distance(): number {
        return this.#light.distance;
    }

    /**
     * The distance of the light radiance
     * @param {number} value
     */
    public set distance(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.distance = value;
        this.#logger.info(`Light (${this.#light.id}): distance was set to: ${value}`);
    }

    /**
     * The percentage of the cone that is part of the penmubra
     * @return {number}
     */
    public get penumbra(): number {
        return this.#light.penumbra;
    }

    /**
     * The percentage of the cone that is part of the penmubra
     * @param {number} value
     */
    public set penumbra(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.penumbra = value;
        this.#logger.info(`Light (${this.#light.id}): penumbra was set to: ${value}`);
    }

    /**
     * The position of the light
     * @return {vec3}
     */
    public get position(): vec3 {
        return this.#light.position;
    }

    /**
     * The position of the light
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.position = value;
        this.#logger.info(`Light (${this.#light.id}): position was set to: ${value}`);
    }

    /**
     * The target of the light
     * @return {vec3}
     */
    public get target(): vec3 {
        return this.#light.target;
    }

    /**
     * The target of the light
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.target = value;
        this.#logger.info(`Light (${this.#light.id}): target was set to: ${value}`);
    }

    public clone() {
        return new SpotLight(<SpotLightLogic>this.#light.clone());
    }

    // #endregion Public Accessors (12)
}