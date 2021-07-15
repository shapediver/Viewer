import { AbstractSdtfData } from '../AbstractSdtfData'

export class SdtfCustomItem extends AbstractSdtfData<any> {
  // #region Public Accessors (2)

  public get data(): Promise<any> {
    if (this.value !== undefined) {
      return Promise.resolve(this.value);
    } else {
      return this.accessor!.load();
    }
  }

  public set data(data: Promise<any>) {
    data.then((data) => {
      this._value = data;
    });
  }

  // #endregion Public Accessors (2)
}