import { AbstractSdtfData } from '../AbstractSdtfData'

export class SdtfAttributes {
  // #region Constructors (1)

  constructor(private _attributes: {
    [key: string]: AbstractSdtfData<any>
  }) { }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get attributes(): { [key: string]: AbstractSdtfData<any> } {
    return this._attributes;
  }

  public set attributes(value: { [key: string]: AbstractSdtfData<any> }) {
    this._attributes = value;
  }
  // #endregion Public Accessors (1)
}