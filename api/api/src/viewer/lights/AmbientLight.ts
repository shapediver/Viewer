import { Light } from "./Light";
import { AmbientLight as AmbientLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { Viewer } from "../Viewer";

export class AmbientLight extends Light {
    // #region Properties (1)

    readonly #light: AmbientLightLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: AmbientLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
    }
    
    // #endregion Constructors (1)
}