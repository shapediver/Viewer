import { AbstractParameter } from "./AbstractParameter";
import { SParameter as SParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class SParameter extends AbstractParameter<string> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: SParameterLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: SParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

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

    // #endregion Public Accessors (3)
}