import { Light } from "./Light";
import { HemisphereLight as HemisphereLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export class HemisphereLight extends Light {
    // #region Properties (1)

    readonly #light: HemisphereLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: HemisphereLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter groundColor
     * @return {vec3}
     */
    public get groundColor(): vec3 {
        return this.#light.groundColor;
    }

    /**
     * Setter groundColor
     * @param {vec3} value
     */
    public set groundColor(value: vec3) {
        this.#light.groundColor = value;
    }

    // #endregion Public Accessors (2)
}