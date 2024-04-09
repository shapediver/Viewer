import { vec3 } from "gl-matrix";
import { ILight, LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { ILightApi } from "../../../interfaces/viewport/lights/ILightApi";
import { InputValidator, Logger } from "@shapediver/viewer.shared.services";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";
import { Color } from "@shapediver/viewer.shared.types";

export abstract class AbstractLightApi implements ILightApi {
    // #region Properties (15)

    readonly #light: ILight;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
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

    public get color(): Color {
        return this.#light.color;
    }

    public set color(value: Color) {
        const scope = 'color';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'color');
        this.#light.color = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get id(): string {
        return this.#light.id;
    }

    public get intensity(): number {
        return this.#light.intensity;
    }

    public set intensity(value: number) {
        const scope = 'intensity';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#light.intensity = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get name(): string | undefined {
        return this.#light.name;
    }

    public set name(value: string | undefined) {
        const scope = 'name';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'string', false);
        this.#light.name = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get order(): number | undefined {
        return this.#light.order;
    }

    public set order(value: number | undefined) {
        const scope = 'order';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number', false);
        this.#light.order = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get type(): LIGHT_TYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (12)
}