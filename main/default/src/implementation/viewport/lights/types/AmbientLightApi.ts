import { IAmbientLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IAmbientLightApi } from "../../../../interfaces/viewport/lights/types/IAmbientLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class AmbientLightApi extends AbstractLightApi implements IAmbientLightApi {
    // #region Properties (1)

    readonly #light: IAmbientLight;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: IAmbientLight) {
        super(light);
        this.#light = light;
        this.scope = 'AmbientLightApi';
    }

    // #endregion Constructors (1)
}