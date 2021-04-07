import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { AbstractParameter } from "./AbstractParameter";
import { Session } from "./Session";

export class Parameter extends AbstractParameter<string> {

  // #region Constructors (1)

  constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
    super(mySession, id, parameterDefinition);
    this._value = parameterDefinition.value;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (13)

  /**
   * Getter value
   * @return {string}
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Setter value
   * @param {string} value
   */
  public set value(value: string) {
    this._value = value;
  }

  // #endregion Public Accessors (13)
}