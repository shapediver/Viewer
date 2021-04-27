import { IParameter, Parameter as ParameterLogic, FileParameter as FileParameterLogic, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export abstract class AbstractParameter<T> implements IParameter<T> {
  // #region Properties (6)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #parameter: ParameterLogic | FileParameterLogic;

  // #endregion Properties (6)

  // #region Constructors (1)

  /**
   * @ignore
   * @param p 
   */
  constructor(p: ParameterLogic | FileParameterLogic) {
    this.#parameter = p;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (18)

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
     * Getter displayName
     * @return {string | undefined}
     */
  public get displayName(): string | undefined {
		return this.#parameter.displayName;
	}

  /**
     * Setter displayName
     * @param {string | undefined} value
     */
  public set displayName(value: string | undefined) {
    this.#inputValidator.validate(value, 'string', false);
    this.#parameter.displayName = value;
    this.#logger.info(`Parameter (${this.id}) displayName was set to: ${value}`);
	}

  /**
   * The format of the parameter.
   * @return {string[] | undefined}
   */
  public get format(): string[] | undefined {
    return this.#parameter.format;
  }

  /**
     * Getter hidden
     * @return {boolean}
     */
  public get hidden(): boolean {
		return this.#parameter.hidden;
	}

  /**
     * Setter hidden
     * @param {boolean} value
     */
  public set hidden(value: boolean) {
    this.#inputValidator.validate(value, 'boolean');
    this.#parameter.hidden = value;
    this.#logger.info(`Parameter (${this.id}) hidden was set to: ${value}`);
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
     * Getter order
     * @return {number | undefined}
     */
  public get order(): number | undefined {
		return this.#parameter.order;
	}

  /**
     * Setter order
     * @param {number | undefined} value
     */
  public set order(value: number | undefined) {
    this.#inputValidator.validate(value, 'number', false);
    this.#parameter.order = value;
    this.#logger.info(`Parameter (${this.id}) order was set to: ${value}`);
	}

  /**
   * The type of the parameter.
   * @return {PARAMETERTYPE}
   */
  public get type(): PARAMETERTYPE {
    return this.#parameter.type;
  }

  /**
   * The visualization description of the parameter.
   * @return {PARAMETERVISUALIZATION | undefined}
   */
  public get visualization(): PARAMETERVISUALIZATION | undefined {
    return this.#parameter.visualization;
  }

  // #endregion Public Accessors (18)

  // #region Public Abstract Accessors (2)

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

  // #endregion Public Abstract Accessors (2)
}
