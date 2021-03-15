import { Light } from "./Light";
import { DirectionalLight as DirectionalLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export class DirectionalLight extends Light {
    // #region Properties (1)

    readonly #light: DirectionalLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: DirectionalLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * Getter castShadow
     * @return {boolean}
     */
    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    /**
     * Setter castShadow
     * @param {boolean} value
     */
    public set castShadow(value: boolean) {
        this.#light.castShadow = value;
    }

    /**
     * Getter direction
     * @return {vec3}
     */
    public get direction(): vec3 {
        return this.#light.direction;
    }

    /**
     * Setter direction
     * @param {vec3} value
     */
    public set direction(value: vec3) {
        this.#light.direction = value;
    }

    /**
     * Getter shadowMapBias
     * @return {number}
     */
    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    /**
     * Setter shadowMapBias
     * @param {number} value
     */
    public set shadowMapBias(value: number) {
        this.#light.shadowMapBias = value;
    }

    /**
     * Getter shadowMapRadius
     * @return {number}
     */
    public get shadowMapRadius(): number {
        return this.#light.shadowMapRadius;
    }

    /**
     * Setter shadowMapRadius
     * @param {number} value
     */
    public set shadowMapRadius(value: number) {
        this.#light.shadowMapRadius = value;
    }

    /**
     * Getter shadowMapResolution
     * @return {number}
     */
    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    /**
     * Setter shadowMapResolution
     * @param {number} value
     */
    public set shadowMapResolution(value: number) {
        this.#light.shadowMapResolution = value;
    }

    // #endregion Public Accessors (4)
}