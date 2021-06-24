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
        this.#logger.debugLow(`Light(${this.id}).updateCastShadow: Updating CastShadow to ${value}.`);
        this.#inputValidator.validateAndError(`Light(${this.id}).updateCastShadow`, value, 'boolean');
        this.#light.castShadow = value;
        this.#logger.info(` Light(${this.id}).updateCastShadow: castShadow was set to: ${value}`);
    }

    /**
     * The directional of the light
     * @param {vec3} value
     */
    public updateDirection(value: vec3) {
        this.#logger.debugLow(`Light(${this.id}).updateDirection: Updating Direction to ${value}.`);
        this.#inputValidator.validateAndError(`Light(${this.id}).updateDirection`, value, 'vec3');
        this.#light.direction = value;
        this.#logger.info(` Light(${this.id}).updateDirection: direction was set to: ${value}`);
    }

    /**
     * The bias of the shadow map
     * @param {number} value
     */
    public updateShadowMapBias(value: number) {
        this.#logger.debugLow(`Light(${this.id}).updateShadowMapBias: Updating ShadowMapBias to ${value}.`);
        this.#inputValidator.validateAndError(`Light(${this.id}).updateShadowMapBias`, value, 'number');
        this.#light.shadowMapBias = value;
        this.#logger.info(` Light(${this.id}).updateShadowMapBias: shadowMapBias was set to: ${value}`);
    }

    /**
     * The resolution of the shadow map
     * @param {number} value
     */
    public updateShadowMapResolution(value: number) {
        this.#logger.debugLow(`Light(${this.id}).updateShadowMapResolution: Updating ShadowMapResolution to ${value}.`);
        this.#inputValidator.validateAndError(`Light(${this.id}).updateShadowMapResolution`, value, 'number');
        this.#light.shadowMapResolution = value;
        this.#logger.info(` Light(${this.id}).updateShadowMapResolution: shadowMapResolution was set to: ${value}`);
    }

    // #endregion Public Methods (4)
}