import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export abstract class AbstractParameter<T> implements IParameter<T> {
  // #region Properties (3)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #parameter: IParameter<T>;

  // #endregion Properties (3)

  // #region Constructors (1)

  /**
   * @ignore
   * @param p 
   */
  constructor(p: IParameter<T>) {
    this.#parameter = p;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (12)

  /**
   * The default value of the parameter.
   * @return {T}
   */
  public get defval(): T {
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
   * The name of the parameter.
   * @return {string}
   */
  public get name(): string {
    return this.#parameter.name;
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
   * @return {PARAMETERVISUALIZATION}
   */
  public get visualization(): PARAMETERVISUALIZATION  {
    return this.#parameter.visualization;
  }

  // #endregion Public Accessors (12)

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
