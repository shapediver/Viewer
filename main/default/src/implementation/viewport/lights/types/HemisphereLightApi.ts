import { vec3 } from "gl-matrix";
import { IHemisphereLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IHemisphereLightApi } from "../../../../interfaces/viewport/lights/types/IHemisphereLightApi";
import { AbstractLightApi } from "../AbstractLightApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { IViewportApi } from "../../../../interfaces/viewport/IViewportApi";
import { Color } from "@shapediver/viewer.shared.types";

export class HemisphereLightApi extends AbstractLightApi implements IHemisphereLightApi {
    // #region Properties (1)

    readonly #light: IHemisphereLight;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #viewportApi: IViewportApi;
    
    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: IHemisphereLight) {
        super(viewportApi, light)
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'HemisphereLightApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get groundColor(): Color {
        return this.#light.groundColor;
    }

    public set groundColor(value: Color) {      
        const scope = 'groundColor';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, value, 'color');
            this.#light.groundColor = value;
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.render("HemisphereLightApi.groundColor");
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `${this.scope}.${scope}`, e);
        }
    }

    // #endregion Public Accessors (2)
}