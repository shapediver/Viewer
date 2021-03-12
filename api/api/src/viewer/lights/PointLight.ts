import { Light } from "./Light";
import { PointLight as PointLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export class PointLight extends Light {
    // #region Properties (1)

    readonly #light: PointLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: PointLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

    /**
     * Getter decay
     * @return {number}
     */
    public get decay(): number {
        return this.#light.decay;
    }

    /**
     * Setter decay
     * @param {number} value
     */
    public set decay(value: number) {
        this.#light.decay = value;
    }

    /**
     * Getter distance
     * @return {number}
     */
    public get distance(): number {
        return this.#light.distance;
    }

    /**
     * Setter distance
     * @param {number} value
     */
    public set distance(value: number) {
        this.#light.distance = value;
    }

    /**
     * Getter position
     * @return {vec3}
     */
    public get position(): vec3 {
        return this.#light.position;
    }

    /**
     * Setter position
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this.#light.position = value;
    }

    // #endregion Public Accessors (6)
}