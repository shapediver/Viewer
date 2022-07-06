import { vec3 } from "gl-matrix";
import { IPointLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IPointLightApi } from "../../../../interfaces/viewport/lights/types/IPointLightApi";
import { AbstractLightApi } from "../AbstractLightApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IViewportApi } from "../../../../interfaces/viewport/IViewportApi";

export class PointLightApi extends AbstractLightApi implements IPointLightApi {
    // #region Properties (4)

    readonly #light: IPointLight;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: IPointLight) {
        super(viewportApi, light)
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'PointLightApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    public get decay(): number {
        return this.#light.decay;
    }

    public set decay(value: number) {
        const scope = 'decay';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'number');
            this.#light.decay = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get distance(): number {
        return this.#light.distance;
    }

    public set distance(value: number) {
        const scope = 'distance';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'number');
            this.#light.distance = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get position(): vec3 {
        return this.#light.position;
    }

    public set position(value: vec3) {
        const scope = 'position';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'vec3');
            this.#light.position = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    // #endregion Public Accessors (6)
}