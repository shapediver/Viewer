import { vec3 } from "gl-matrix";
import { ISpotLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { ISpotLightApi } from "../../../../interfaces/viewport/lights/types/ISpotLightApi";
import { AbstractLightApi } from "../AbstractLightApi";
import { InputValidator, Logger } from "@shapediver/viewer.shared.services";
import { IViewportApi } from "../../../../interfaces/viewport/IViewportApi";

export class SpotLightApi extends AbstractLightApi implements ISpotLightApi {
    // #region Properties (7)

    readonly #light: ISpotLight;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: ISpotLight) {
        super(viewportApi, light)
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'SpotLightApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get angle(): number {
        return this.#light.angle;
    }

    public set angle(value: number) {
        const scope = 'angle';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.angle = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get decay(): number {
        return this.#light.decay;
    }

    public set decay(value: number) {
        const scope = 'decay';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.decay = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get distance(): number {
        return this.#light.distance;
    }

    public set distance(value: number) {
        const scope = 'distance';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.distance = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get penumbra(): number {
        return this.#light.penumbra;
    }

    public set penumbra(value: number) {
        const scope = 'penumbra';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.penumbra = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get position(): vec3 {
        return this.#light.position;
    }

    public set position(value: vec3) {
        const scope = 'position';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'vec3');
        this.#light.position = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get target(): vec3 {
        return this.#light.target;
    }

    public set target(value: vec3) {
        const scope = 'target';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'vec3');
        this.#light.target = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    // #endregion Public Accessors (12)
}