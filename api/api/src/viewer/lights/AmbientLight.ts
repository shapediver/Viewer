import { Light } from "./Light";
import { AmbientLight as AmbientLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";

export class AmbientLight extends Light {
    // #region Properties (1)

    readonly #light: AmbientLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: AmbientLightLogic) {
        super(light);
        this.#light = light;
    }
    
    // #endregion Constructors (1)
}