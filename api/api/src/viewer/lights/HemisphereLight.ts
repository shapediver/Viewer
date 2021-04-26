import { Light } from "./Light";
import { HemisphereLight as HemisphereLightLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { Converter, InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";

export class HemisphereLight extends Light {
    // #region Properties (1)

    readonly #light: HemisphereLightLogic;
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

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
     * @return {string | number | vec3}
     */
    public get groundColor(): string | number | vec3 {
        return this.#light.groundColor;
    }

    /**
     * The ground color of the light
     * @param {string | number | vec3} value
     */
    public set groundColor(value: string | number | vec3) {
        this.#inputValidator.validate(value, 'color');
        this.#light.groundColor = this.#converter.toColor(value);
        this.#logger.info(`Light (${this.#light.id}): groundColor was set to: ${value}`);
    }

    // #endregion Public Accessors (2)
}