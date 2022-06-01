import { vec3 } from "gl-matrix";
import { IPointLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IPointLightApi } from "../../../../interfaces/viewport/lights/types/IPointLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class PointLightApi extends AbstractLightApi implements IPointLightApi {
    // #region Properties (4)

    readonly #light: IPointLight;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(light: IPointLight) {
            super(light)
            this.#light = light;
        }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    public get decay(): number {
        return this.#light.decay;
    }

    public set decay(value: number) {
        this.#light.decay = value;
    }

    public get distance(): number {
        return this.#light.distance;
    }

    public set distance(value: number) {
        this.#light.distance = value;
    }

    public get position(): vec3 {
        return this.#light.position;
    }

    public set position(value: vec3) {
        this.#light.position = value;
    }

    // #endregion Public Accessors (6)
}