import { IParameter, Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class Parameter implements IParameter {

  readonly #parameter: ParameterLogic;

  /**
   * @ignore
   * @param p 
   */
  constructor(p: ParameterLogic) {
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
   * The description of the parameter.
   * @return {string | undefined}
   */
  public get note(): string | undefined {
    return this.#parameter.note;
  }

  /**
   * The type of the parameter.
   * @return {string}
   */
  public get type(): string {
    return this.#parameter.type;
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
    this.#parameter.value = value;
  }

  /**
   * The visualization description of the parameter.
   * @return {string | undefined}
   */
  public get visualization(): string | undefined {
    return this.#parameter.visualization;
  }
}
