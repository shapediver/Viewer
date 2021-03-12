import { Light } from "./Light";
import { SpotLight as SpotLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export class SpotLight extends Light {
    // #region Properties (1)

    readonly #light: SpotLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: SpotLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * Getter angle
     * @return {number}
     */
    public get angle(): number {
        return this.#light.angle;
    }

    /**
     * Setter angle
     * @param {number} value
     */
    public set angle(value: number) {
        this.#light.angle = value;
    }

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
     * Getter penumbra
     * @return {number}
     */
    public get penumbra(): number {
        return this.#light.penumbra;
    }

    /**
     * Setter penumbra
     * @param {number} value
     */
    public set penumbra(value: number) {
        this.#light.penumbra = value;
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

    /**
     * Getter target
     * @return {vec3}
     */
    public get target(): vec3 {
        return this.#light.target;
    }

    /**
     * Setter target
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this.#light.target = value;
    }

    // #endregion Public Accessors (12)
}