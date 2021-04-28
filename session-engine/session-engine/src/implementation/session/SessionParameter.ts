import { ISessionParameter } from "../../interfaces/session/ISessionParameter";

export class SessionParameter implements ISessionParameter {
  // #region Properties (1)

  private _value: string;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(
    private _id: string,
    private _type: string,
    private _defval: string,
    private _choices?: string[],
    private _decimalplaces?: string,
    private _format?: Array<string>,
    private _max?: string,
    private _min?: string,
    private _name?: string,
    private _note?: string,
    private _visualization?: string,
  ) {
    this._value = this._defval;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (24)

  /**
   * Getter choices
   * @return {string[] | undefined}
   */
  public get choices(): string[] | undefined {
    return this._choices;
  }

  /**
   * Setter choices
   * @param {string[] | undefined} value
   */
  public set choices(value: string[] | undefined) {
    this._choices = value;
  }

  /**
   * Getter decimalplaces
   * @return {string | undefined}
   */
  public get decimalplaces(): string | undefined {
    return this._decimalplaces;
  }

  /**
   * Setter decimalplaces
   * @param {string | undefined} value
   */
  public set decimalplaces(value: string | undefined) {
    this._decimalplaces = value;
  }

  /**
   * Getter defval
   * @return {string}
   */
  public get defval(): string {
    return this._defval;
  }

  /**
   * Setter defval
   * @param {string} value
   */
  public set defval(value: string) {
    this._defval = value;
  }

  /**
   * Getter format
   * @return {Array<string> | undefined}
   */
  public get format(): Array<string> | undefined {
    return this._format;
  }

  /**
   * Setter format
   * @param {Array<string> | undefined} value
   */
  public set format(value: Array<string> | undefined) {
    this._format = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Setter id
   * @param {string} value
   */
  public set id(value: string) {
    this._id = value;
  }

  /**
   * Getter max
   * @return {string | undefined}
   */
  public get max(): string | undefined {
    return this._max;
  }

  /**
   * Setter max
   * @param {string | undefined} value
   */
  public set max(value: string | undefined) {
    this._max = value;
  }

  /**
   * Getter min
   * @return {string | undefined}
   */
  public get min(): string | undefined {
    return this._min;
  }

  /**
   * Setter min
   * @param {string | undefined} value
   */
  public set min(value: string | undefined) {
    this._min = value;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Setter name
   * @param {string | undefined} value
   */
  public set name(value: string | undefined) {
    this._name = value;
  }

  /**
   * Getter note
   * @return {string | undefined}
   */
  public get note(): string | undefined {
    return this._note;
  }

  /**
   * Setter note
   * @param {string | undefined} value
   */
  public set note(value: string | undefined) {
    this._note = value;
  }

  /**
   * Getter type
   * @return {string}
   */
  public get type(): string {
    return this._type;
  }

  /**
   * Setter type
   * @param {string} value
   */
  public set type(value: string) {
    this._type = value;
  }

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

  /**
   * Getter visualization
   * @return {string | undefined}
   */
  public get visualization(): string | undefined {
    return this._visualization;
  }

  /**
   * Setter visualization
   * @param {string | undefined} value
   */
  public set visualization(value: string | undefined) {
    this._visualization = value;
  }

  // #endregion Public Accessors (24)
}