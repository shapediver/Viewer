import { IParameter, Parameter as ParameterLogic, FileParameter as FileParameterLogic, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export abstract class AbstractParameter<T> implements IParameter<T> {

  readonly #parameter: ParameterLogic | FileParameterLogic;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);

  /**
   * @ignore
   * @param p 
   */
  constructor(p: ParameterLogic | FileParameterLogic) {
    this.#parameter = p;
  }

  /**
   * The possible choices.
   * @return {string[] | undefined}
   */
  public get choices(): string[] | undefined {
    return this.#parameter.choices;
  }

  /**
   * The number of decimal places.
   * @return {string | undefined}
   */
  public get decimalplaces(): string | undefined {
    return this.#parameter.decimalplaces;
  }

  /**
   * The default value of the parameter.
   * @return {string}
   */
  public get defval(): string {
    return this.#parameter.defval;
  }

  /**
   * The format of the parameter.
   * @return {string[] | undefined}
   */
  public get format(): string[] | undefined {
    return this.#parameter.format;
  }

  /**
   * The id of the parameter.
   * @return {string}
   */
  public get id(): string {
    return this.#parameter.id;
  }

  /**
   * The maximum value of the parameter.
   * @return {string | undefined}
   */
  public get max(): string | undefined {
    return this.#parameter.max;
  }

  /**
   * The minimum value of the parameter.
   * @return {string | undefined}
   */
  public get min(): string | undefined {
    return this.#parameter.min;
  }

  /**
   * The name of the parameter.
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this.#parameter.name;
  }

  /**
   * The name of the parameter.
   * @param {string | undefined} value
   */
  public set name(value: string | undefined) {
    this.#inputValidator.validate(value, 'string');
    this.#parameter.name = value;
    this.#logger.info(`Parameter (${this.id}) name was set to: ${value}`);
  }

  /**
   * The description of the parameter.
   * @return {string | undefined}
   */
  public get note(): string | undefined {
    return this.#parameter.note;
  }

  /**
   * The type of the parameter.
   * @return {PARAMETERTYPE}
   */
  public get type(): PARAMETERTYPE {
    return this.#parameter.type;
  }

  /**
   * The value of the parameter.
   * @return {T}
   */
  public abstract get value(): T;

  /**
   * The value of the parameter.
   * @param {T} value
   */
  public abstract set value(value: T);

  /**
   * The visualization description of the parameter.
   * @return {PARAMETERVISUALIZATION | undefined}
   */
  public get visualization(): PARAMETERVISUALIZATION | undefined {
    return this.#parameter.visualization;
  }
}
