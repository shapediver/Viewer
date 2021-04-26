import { IParameter, Parameter as ParameterLogic, FileParameter as FileParameterLogic, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export abstract class AbstractParameter<T> implements IParameter<T> {
  // #region Properties (12)

  readonly #parameter: ParameterLogic | FileParameterLogic;
  readonly choices?: string[] | undefined;
  readonly decimalplaces?: string | undefined;
  readonly defval: string;
  readonly format?: string[] | undefined;
  readonly id: string;
  readonly max?: string | undefined;
  readonly min?: string | undefined;
  readonly note?: string | undefined;
  readonly type: PARAMETERTYPE;
  readonly visualization?: PARAMETERVISUALIZATION | undefined;

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);

  name?: string | undefined;

  // #endregion Properties (12)

  // #region Constructors (1)

  /**
   * @ignore
   * @param p 
   */
  constructor(p: ParameterLogic | FileParameterLogic) {
    this.#parameter = p;
    this.choices = this.#parameter.choices;
    this.decimalplaces = this.#parameter.decimalplaces;
    this.defval = this.#parameter.defval;
    this.format = this.#parameter.format;
    this.id = this.#parameter.id;
    this.max = this.#parameter.max;
    this.min = this.#parameter.min;
    this.note = this.#parameter.note;
    this.type = this.#parameter.type;
    this.visualization = this.#parameter.visualization;
    this.name = this.#parameter.name;
  }

  // #endregion Constructors (1)

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
