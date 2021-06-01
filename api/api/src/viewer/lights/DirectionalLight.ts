import { Light } from "./Light";
import { DirectionalLight as DirectionalLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class DirectionalLight extends Light {
    // #region Properties (1)

    readonly #light: DirectionalLightLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: DirectionalLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * The option to cast shadow
     * @return {boolean}
     */
    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    /**
     * The option to cast shadow
     * @param {boolean} value
     */
    public set castShadow(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#light.castShadow = value;
        this.#logger.info(`Light (${this.#light.id}): castShadow was set to: ${value}`);
    }

    /**
     * The directional of the light
     * @return {vec3}
     */
    public get direction(): vec3 {
        return this.#light.direction;
    }

    /**
     * The directional of the light
     * @param {vec3} value
     */
    public set direction(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.direction = value;
        this.#logger.info(`Light (${this.#light.id}): direction was set to: ${value}`);
    }

    /**
     * The bias of the shadow map
     * @return {number}
     */
    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    /**
     * The bias of the shadow map
     * @param {number} value
     */
    public set shadowMapBias(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#light.shadowMapBias = value;
        this.#logger.info(`Light (${this.#light.id}): shadowMapBias was set to: ${value}`);
    }

    /**
     * The resolution of the shadow map
     * @return {number}
     */
    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    /**
     * The resolution of the shadow map
     * @param {number} value
     */
    public set shadowMapResolution(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#light.shadowMapResolution = value;
        this.#logger.info(`Light (${this.#light.id}): shadowMapResolution was set to: ${value}`);
    }

    public clone() {
        return new DirectionalLight(<DirectionalLightLogic>this.#light.clone());
    }

    // #endregion Public Accessors (4)
}