import { AbstractParameter } from "../AbstractParameter";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class NumberParameter extends AbstractParameter<number> {
    // #region Properties (1)

    readonly #parameter: ParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    value: number;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: ParameterLogic) {
        super(p);
        this.#parameter = p;
        this.value = +this.#parameter.value;

        return new Proxy(this, {
            get: (target: NumberParameter, property: keyof NumberParameter, receiver: any) => {
                if (property === 'value') return +this.#parameter.value;
                return target[property];
            },
            set: (target: NumberParameter, property: keyof NumberParameter, value: any, receiver: any) => {
                if(property === 'value') {
                    this.#inputValidator.validate(value, 'number');
                    this.#parameter.value = value + '';
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