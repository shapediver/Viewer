import { Light } from "./Light";
import { HemisphereLight as HemisphereLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class HemisphereLight extends Light {
    // #region Properties (1)

    readonly #light: HemisphereLightLogic;
    readonly #inputValidator = <InputValidator>container.resolve(InputValidator);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: HemisphereLightLogic) {
        super(light);
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * The ground color of the light
     * @return {vec3}
     */
    public get groundColor(): vec3 {
        return this.#light.groundColor;
    }

    /**
     * The ground color of the light
     * @param {vec3} value
     */
    public set groundColor(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.groundColor = value;
    }

    // #endregion Public Accessors (2)
}