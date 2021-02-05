import { ISessionAction } from "../interfaces/ISessionAction";

export class SessionAction implements ISessionAction {
  // #region Constructors (1)

  constructor(
    private _href?: string,
    private _method?: string,
    private _name?: string,
    private _template?: string,
    private _title?: string,
  ) {
  }

  // #endregion Constructors (1)

  // #region Public Accessors (10)

  /**
   * Getter href
   * @return {string | undefined}
   */
  public get href(): string | undefined {
    return this._href;
  }

  /**
   * Setter href
   * @param {string | undefined} value
   */
  public set href(value: string | undefined) {
    this._href = value;
  }

  /**
   * Getter method
   * @return {string | undefined}
   */
  public get method(): string | undefined {
    return this._method;
  }

  /**
   * Setter method
   * @param {string | undefined} value
   */
  public set method(value: string | undefined) {
    this._method = value;
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
   * Getter template
   * @return {string | undefined}
   */
  public get template(): string | undefined {
    return this._template;
  }

  /**
   * Setter template
   * @param {string | undefined} value
   */
  public set template(value: string | undefined) {
    this._template = value;
  }

  /**
   * Getter title
   * @return {string | undefined}
   */
  public get title(): string | undefined {
    return this._title;
  }

  /**
   * Setter title
   * @param {string | undefined} value
   */
  public set title(value: string | undefined) {
    this._title = value;
  }

  // #endregion Public Accessors (10)
}