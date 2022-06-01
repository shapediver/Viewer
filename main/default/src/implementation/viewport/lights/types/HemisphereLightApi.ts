import { vec3 } from "gl-matrix";
import { IHemisphereLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IHemisphereLightApi } from "../../../../interfaces/viewport/lights/types/IHemisphereLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class HemisphereLightApi extends AbstractLightApi implements IHemisphereLightApi {
    // #region Properties (1)

    readonly #light: IHemisphereLight;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: IHemisphereLight) {
            super(light)
            this.#light = light;
        }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get groundColor(): string | number | vec3 {
        return this.#light.groundColor;
    }

    public set groundColor(value: string | number | vec3) {
        this.#light.groundColor = value;
    }

    // #endregion Public Accessors (2)
}