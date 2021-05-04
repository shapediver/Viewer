import { AbstractParameter } from "./AbstractParameter";
import { IntParameter as IntParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class IntParameter extends AbstractParameter<number | string> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: IntParameterLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: IntParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    /**
     * Getter max
     * @return {number}
     */
    public get max(): number {
        return this.#parameter.max;
    }

    /**
     * Getter min
     * @return {number}
     */
    public get min(): number {
        return this.#parameter.min;
    }

    /**
     * The value of the parameter.
     * @return {number | string}
     */
    public get value(): number | string {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {number | string} value
     */
    public set value(value: number | string) {
        if(typeof value === 'string') value = +value;
        this.#inputValidator.validate(value, 'number');
        this.#parameter.value = value;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (5)
}