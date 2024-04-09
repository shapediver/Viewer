import { IAmbientLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IViewportApi } from "../../../../interfaces/viewport/IViewportApi";
import { IAmbientLightApi } from "../../../../interfaces/viewport/lights/types/IAmbientLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class AmbientLightApi extends AbstractLightApi implements IAmbientLightApi {
    // #region Properties (1)

    readonly #light: IAmbientLight;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, light: IAmbientLight) {
        super(viewportApi, light)
        this.#viewportApi = viewportApi;
        this.#light = light;
        this.scope = 'AmbientLightApi';
    }

    // #endregion Constructors (1)
}