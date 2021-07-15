import { SdtfBufferView } from './SdtfBufferView'

export class SdtfAccessor {
  // #region Properties (1)

  private _data?: any;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(
    private readonly _bufferView: SdtfBufferView,
    private _id: string
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (2)

  /**
   * Getter bufferView
   * @return {SdtfBufferView}
   */
  public get bufferView(): SdtfBufferView {
    return this._bufferView;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  // #endregion Public Accessors (2)

  // #region Public Methods (1)

  public async load(): Promise<any> {
    if (this._data) return this._data;
    this._data = await this.bufferView.load();
    return this._data;
  }

  // #endregion Public Methods (1)
}