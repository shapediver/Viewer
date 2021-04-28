import { AbstractParameter } from "./AbstractParameter";
import { EvenParameter as EvenParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class EvenParameter extends AbstractParameter<number> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: EvenParameterLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: EvenParameterLogic) {
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
     * @return {number}
     */
    public get value(): number {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {number} value
     */
    public set value(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#parameter.value = value;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (5)
}