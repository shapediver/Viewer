import { Light } from "./Light";
import { PointLight as PointLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class PointLight extends Light {
    // #region Properties (1)

    readonly #light: PointLightLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: PointLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

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

    // #endregion Public Accessors (6)
}