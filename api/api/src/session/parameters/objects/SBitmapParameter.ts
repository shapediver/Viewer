import { AbstractParameter } from "./AbstractParameter";
import { SBitmapParameter as SBitmapParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class SBitmapParameter extends AbstractParameter<File | Blob | string> {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #parameter: SBitmapParameterLogic;

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: SBitmapParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
   * Getter format
   * @return {string[]}
   */
    public get format(): string[] {
        return this.#parameter.format;
    }

    /**
   * Getter max
   * @return {number}
   */
    public get max(): number {
        return this.#parameter.max;
    }

    /**
     * The value of the parameter.
     * @return {File | Blob | string}
     */
    public get value(): File | Blob | string {
        return this.#parameter.value;
    }

    /**
     * The value of the parameter.
     * @param {File | Blob | string} value
     */
    public set value(value: File | Blob | string) {
        this.#inputValidator.validate(value, 'file');
        this.#parameter.value = value;
        this.#logger.info(`Parameter (${this.id}) was set to: ${value}`);
    }

    // #endregion Public Accessors (4)
}