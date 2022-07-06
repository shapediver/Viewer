import { vec3 } from "gl-matrix";
import { ILight, LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { ILightApi } from "../../../interfaces/viewport/lights/ILightApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";

export abstract class AbstractLightApi implements ILightApi {
    // #region Properties (15)

    readonly #light: ILight;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewportApi: IViewportApi;

    protected scope: string = 'AbstractLightApi';

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: ILight) {
        this.#viewportApi = viewportApi;
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get color(): string | number | vec3 {
        return this.#light.color;
    }

    public set color(value: string | number | vec3) {
        const scope = 'color';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'color');
            this.#light.color = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get id(): string {
        return this.#light.id;
    }

    public get intensity(): number {
        return this.#light.intensity;
    }

    public set intensity(value: number) {
        const scope = 'intensity';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'number');
            this.#light.intensity = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get name(): string | undefined {
        return this.#light.name;
    }

    public set name(value: string | undefined) {
        const scope = 'name';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'string', false);
            this.#light.name = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get order(): number | undefined {
        return this.#light.order;
    }

    public set order(value: number | undefined) {
        const scope = 'order';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'number', false);
            this.#light.order = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    public get type(): LIGHT_TYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (12)
}