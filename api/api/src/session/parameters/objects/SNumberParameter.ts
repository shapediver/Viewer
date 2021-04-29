import { AbstractParameter } from "./AbstractParameter";
import { SNumberParameter as SNumberParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class SNumberParameter extends AbstractParameter<string> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: SNumberParameterLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: SNumberParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    /**
     * Getter decimalplaces
     * @return {number}
     */
    public get decimalplaces(): number {
        return this.#parameter.decimalplaces;
    }

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

    // #endregion Public Accessors (5)
}