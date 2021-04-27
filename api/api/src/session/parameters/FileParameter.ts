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

    value: File | Blob | string;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: FileParameterLogic) {
        super(p);
        this.#parameter = p;
        this.value = this.#parameter.value;

        return new Proxy(this, {
            get: (target: FileParameter, property: keyof FileParameter, receiver: any) => {
                if (property === 'value') return this.#parameter.value;
                return target[property];
            },
            set: (target: FileParameter, property: keyof FileParameter, value: any, receiver: any) => {
                if(property === 'value') {
                    this.#inputValidator.validate(value, 'file');
                    this.#parameter.value = value;
                    target[property] = value;
                    this.#logger.info(`Parameter (${target.id}) was set to: ${value}`);
                    return true;
                } else {
                    return false;
                }
            }
        });
    }

    // #endregion Constructors (1)
}