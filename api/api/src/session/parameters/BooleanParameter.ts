import { AbstractParameter } from "../AbstractParameter";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class BooleanParameter extends AbstractParameter<boolean> {
    // #region Properties (1)

    readonly #parameter: ParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    value: boolean;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: ParameterLogic) {
        super(p);
        this.#parameter = p;
        this.value = (this.#parameter.value === "true");

        return new Proxy(this, {
            get: (target: BooleanParameter, property: keyof BooleanParameter, receiver: any) => {
                if (property === 'value') (this.#parameter.value === "true");
                return target[property];
            },
            set: (target: BooleanParameter, property: keyof BooleanParameter, value: any, receiver: any) => {
                if(property === 'value') {
                    this.#inputValidator.validate(value, 'boolean');
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