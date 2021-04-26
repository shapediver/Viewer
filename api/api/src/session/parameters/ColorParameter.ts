import { AbstractParameter } from "../AbstractParameter";
import { Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { Converter, InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { vec3 } from "gl-matrix";

export class ColorParameter extends AbstractParameter<string | number | vec3> {
    // #region Properties (1)

    readonly #parameter: ParameterLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    value: string | number | vec3;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param p 
     */
    constructor(p: ParameterLogic, handler: ProxyHandler<ColorParameter> = {}) {
        super(p);
        this.#parameter = p;
        this.value = this.#parameter.value;

        Object.assign(handler, {
            get: (target: ColorParameter, property: keyof ColorParameter, receiver: any) => {
                if (property === 'value') return this.#parameter.value;
                return this.#parameter[property];
            },
            set: (target: ColorParameter, property: keyof ColorParameter, value: any, receiver: any) => {
                if(property === 'value') {
                    this.#inputValidator.validate(value, 'color');
                    const colorString = this.#converter.toColor(value);
                    this.#parameter.value = colorString;
                    this.value = colorString;
                    target[property] = colorString;
                    this.#logger.info(`Parameter (${target.id}) was set to: ${value}`);
                    return true;
                } else if (property === 'name') {
                    this.#inputValidator.validate(value, 'string');
                    this.#parameter.name = value;
                    this.name = value;
                    target[property] = value;
                    this.#logger.info(`Parameter (${target.id}) name was set to: ${value}`);
                    return true;
                } else {
                    return false;
                }
            }
        });
    }

    // #endregion Constructors (1)
}