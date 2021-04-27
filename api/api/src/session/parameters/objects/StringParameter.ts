import { AbstractParameter } from "./AbstractParameter";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class StringParameter extends AbstractParameter<string> {
    // #region Properties (1)

    readonly #parameter: ParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

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
     * @return {string}
     */
    public get value(): string {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {string} value
     */
    public set value(value: string) {
        this.#inputValidator.validate(value, 'string');
        this.#parameter.value = value;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (2)
}