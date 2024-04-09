import { vec3 } from "gl-matrix";
import { IDirectionalLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IDirectionalLightApi } from "../../../../interfaces/viewport/lights/types/IDirectionalLightApi";
import { AbstractLightApi } from "../AbstractLightApi";
import { InputValidator, Logger } from "@shapediver/viewer.shared.services";
import { IViewportApi } from "../../../../interfaces/viewport/IViewportApi";

export class DirectionalLightApi extends AbstractLightApi implements IDirectionalLightApi {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #light: IDirectionalLight;
    readonly #logger: Logger = Logger.instance;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: IDirectionalLight) {
        super(viewportApi, light)
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'DirectionalLightApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    public set castShadow(value: boolean) {
        const scope = 'castShadow';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#light.castShadow = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get direction(): vec3 {
        return this.#light.direction;
    }

    public set direction(value: vec3) {
        const scope = 'direction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'vec3');
        this.#light.direction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    public set shadowMapBias(value: number) {
        const scope = 'shadowMapBias';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.shadowMapBias = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    public set shadowMapResolution(value: number) {
        const scope = 'shadowMapResolution';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.shadowMapResolution = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    // #endregion Public Accessors (8)
}