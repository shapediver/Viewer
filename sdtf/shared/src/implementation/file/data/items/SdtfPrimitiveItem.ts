import { AbstractSdtfData } from '../AbstractSdtfData'

export class SdtfPrimitiveItem<T> extends AbstractSdtfData<T> {
  // #region Public Accessors (2)

  public get data(): Promise<T> {
    return Promise.resolve(this._value);
  }

  public set data(data: Promise<T>) {
    data.then((data) => {
      this._value = data;
    });
  }

  // #endregion Public Accessors (2)
}