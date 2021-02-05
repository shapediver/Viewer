import { ISessionOutputContent } from "../interfaces/ISessionOutputContent";

export class SessionOutputContent implements ISessionOutputContent {
  // #region Properties (5)

  constructor(
    private _converted?: any,
    private _data?: any,
    private _format?: string,
    private _href?: string,
    private _size?: number
  ) { }

  // #endregion Properties (5)

  // #region Public Accessors (10)

  /**
   * Getter converted
   * @return {any}
   */
  public get converted(): any {
    return this._converted;
  }

  /**
   * Setter converted
   * @param {any} value
   */
  public set converted(value: any) {
    this._converted = value;
  }

  /**
   * Getter data
   * @return {any}
   */
  public get data(): any {
    return this._data;
  }

  /**
   * Setter data
   * @param {any} value
   */
  public set data(value: any) {
    this._data = value;
  }

  /**
   * Getter format
   * @return {string | undefined}
   */
  public get format(): string | undefined {
    return this._format;
  }

  /**
   * Setter format
   * @param {string | undefined} value
   */
  public set format(value: string | undefined) {
    this._format = value;
  }

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
   * Getter size
   * @return {number | undefined}
   */
  public get size(): number | undefined {
    return this._size;
  }

  /**
   * Setter size
   * @param {number | undefined} value
   */
  public set size(value: number | undefined) {
    this._size = value;
  }

  // #endregion Public Accessors (10)
}