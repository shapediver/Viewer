import { vec3 } from "gl-matrix";
import { IDirectionalLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IDirectionalLightApi } from "../../../../interfaces/viewport/lights/types/IDirectionalLightApi";
import { AbstractLightApi } from "../AbstractLightApi";

export class DirectionalLightApi extends AbstractLightApi implements IDirectionalLightApi {
    // #region Properties (15)

    readonly #light: IDirectionalLight;

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(light: IDirectionalLight) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    public set castShadow(value: boolean) {
        this.#light.castShadow = value;
    }

    public get direction(): vec3 {
        return this.#light.direction;
    }

    public set direction(value: vec3) {
        this.#light.direction = value;
    }

    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    public set shadowMapBias(value: number) {
        this.#light.shadowMapBias = value;
    }

    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    public set shadowMapResolution(value: number) {
        this.#light.shadowMapResolution = value;
    }

    // #endregion Public Accessors (8)
}