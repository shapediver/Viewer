import { AbstractParameter } from "../AbstractParameter";
import { FileParameter as FileParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class FileParameter extends AbstractParameter<File | Blob | string> {
    // #region Properties (1)

    readonly #parameter: FileParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: FileParameterLogic) {
        super(p);
        this.#parameter = p;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

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

    // #endregion Public Accessors (2)
}