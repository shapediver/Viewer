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

    // #endregion Public Accessors (4)
}