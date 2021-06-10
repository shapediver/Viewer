import { Light } from "./Light";
import { PointLight as PointLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class PointLight extends Light {
    // #region Properties (7)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: PointLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.decay) = this.#light.decay;
        (<any>this.distance) = this.#light.distance;
        (<any>this.position) = this.#light.position;
    }

    readonly decay!: number;
    readonly distance!: number;
    readonly position!: vec3;

    // #endregion Properties (7)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: PointLightLogic) {
        super(light);
        this.#light = light;
        (<PointLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

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
     * The position of the light
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.position = value;
        this.#logger.info(`Light (${this.#light.id}): position was set to: ${value}`);
    }

    // #endregion Public Methods (3)
}