import { vec3 } from "gl-matrix";
import { ISpotLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { ISpotLightApi } from "../../../../interfaces/viewport/lights/types/ISpotLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class SpotLightApi extends AbstractLightApi implements ISpotLightApi {
    // #region Properties (7)

    readonly #light: ISpotLight;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(light: ISpotLight) {
            super(light)
            this.#light = light;
        }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get angle(): number {
        return this.#light.angle;
    }

    public set angle(value: number) {
        this.#light.angle = value;
    }

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

    public get penumbra(): number {
        return this.#light.penumbra;
    }

    public set penumbra(value: number) {
        this.#light.penumbra = value;
    }

    public get position(): vec3 {
        return this.#light.position;
    }

    public set position(value: vec3) {
        this.#light.position = value;
    }

    public get target(): vec3 {
        return this.#light.target;
    }

    public set target(value: vec3) {
        this.#light.target = value;
    }

    // #endregion Public Accessors (12)
}