import { AbstractParameter } from "./AbstractParameter";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { Converter, InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { vec3 } from "gl-matrix";

export class ColorParameter extends AbstractParameter<string | number | vec3> {
    // #region Properties (4)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: ParameterLogic;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: ParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * The value of the parameter.
     * @return {string | vec3 | number}
     */
    public get value(): string | vec3 | number {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {string | vec3 | number} value
     */
    public set value(value: string | vec3 | number) {
        this.#inputValidator.validate(value, 'color');
        const colorString = this.#converter.toColor(value);
        this.#parameter.value = colorString;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (2)
}