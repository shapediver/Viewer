import { ISessionExport } from "../../interfaces/session/ISessionExport";

export class SessionExport implements ISessionExport {
  // #region Constructors (1)

  constructor(
    private _id?: string,
    private _name?: string,
    private _type?: string,
  ) {
  }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  /**
   * Getter id
   * @return {string | undefined }
   */
  public get id(): string | undefined {
    return this._id;
  }

  /**
   * Setter id
   * @param {string | undefined } value
   */
  public set id(value: string | undefined) {
    this._id = value;
  }

  /**
   * Getter name
   * @return {string | undefined }
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Setter name
   * @param {string | undefined } value
   */
  public set name(value: string | undefined) {
    this._name = value;
  }

  /**
   * Getter type
   * @return {string | undefined }
   */
  public get type(): string | undefined {
    return this._type;
  }

  /**
   * Setter type
   * @param {string | undefined } value
   */
  public set type(value: string | undefined) {
    this._type = value;
  }

  // #endregion Public Accessors (6)
}