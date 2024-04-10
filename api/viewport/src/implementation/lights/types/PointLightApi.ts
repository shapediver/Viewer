import { AbstractLightApi } from '../AbstractLightApi';
import { InputValidator, Logger } from '@shapediver/viewer.shared.services';
import { IPointLight } from '@shapediver/viewer.rendering-engine.light-engine';
import { IPointLightApi } from '../../../interfaces/lights/types/IPointLightApi';
import { IViewportApi } from '../../../interfaces/IViewportApi';
import { vec3 } from 'gl-matrix';

export class PointLightApi extends AbstractLightApi implements IPointLightApi {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #light: IPointLight;
    readonly #logger: Logger = Logger.instance;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: IPointLight) {
        super(viewportApi, light);
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'PointLightApi';
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

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

    // #endregion Public Getters And Setters (6)
}