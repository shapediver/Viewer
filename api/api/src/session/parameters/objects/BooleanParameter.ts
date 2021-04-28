import { AbstractParameter } from "./AbstractParameter";
import { BooleanParameter as BooleanParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class BooleanParameter extends AbstractParameter<boolean> {
    // #region Properties (1)

    readonly #parameter: BooleanParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: BooleanParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * The value of the parameter.
     * @return {boolean}
     */
    public get value(): boolean {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {boolean} value
     */
    public set value(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#parameter.value = value;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (2)
}