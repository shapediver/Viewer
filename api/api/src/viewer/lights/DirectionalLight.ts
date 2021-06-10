import { Light } from "./Light";
import { DirectionalLight as DirectionalLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class DirectionalLight extends Light {
    // #region Properties (8)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: DirectionalLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.castShadow) = this.#light.castShadow;
        (<any>this.direction) = this.#light.direction;
        (<any>this.shadowMapBias) = this.#light.shadowMapBias;
        (<any>this.shadowMapResolution) = this.#light.shadowMapResolution;
    }

    readonly castShadow!: boolean
    readonly direction!: vec3
    readonly shadowMapBias!: number
    readonly shadowMapResolution!: number;

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: DirectionalLightLogic) {
        super(light);
        this.#light = light;
        (<DirectionalLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Methods (4)

    /**
     * The option to cast shadow
     * @param {boolean} value
     */
    public updateCastShadow(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#light.castShadow = value;
        this.#logger.info(`Light (${this.#light.id}): castShadow was set to: ${value}`);
    }

    /**
     * The directional of the light
     * @param {vec3} value
     */
    public updateDirection(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.direction = value;
        this.#logger.info(`Light (${this.#light.id}): direction was set to: ${value}`);
    }

    /**
     * The bias of the shadow map
     * @param {number} value
     */
    public updateShadowMapBias(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#light.shadowMapBias = value;
        this.#logger.info(`Light (${this.#light.id}): shadowMapBias was set to: ${value}`);
    }

    /**
     * The resolution of the shadow map
     * @param {number} value
     */
    public updateShadowMapResolution(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#light.shadowMapResolution = value;
        this.#logger.info(`Light (${this.#light.id}): shadowMapResolution was set to: ${value}`);
    }

    // #endregion Public Methods (4)
}