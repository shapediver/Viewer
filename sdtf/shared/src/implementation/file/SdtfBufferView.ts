import { CONTENTTYPE, CONTENT_ENCODING } from "../../enums";
import { SdtfBuffer } from "./SdtfBuffer";

export class SdtfBufferView {
  // #region Properties (1)

  private _data?: any;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(
    private readonly _buffer: SdtfBuffer,
    private readonly _byteLength: number,
    private readonly _byteOffset: number,
    private readonly _contentType: CONTENTTYPE,
    private readonly _contentEncoding?: CONTENT_ENCODING,
    private readonly _name?: string,
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  /**
   * Getter buffer
   * @return {SdtfBuffer}
   */
  public get buffer(): SdtfBuffer {
    return this._buffer;
  }

  /**
   * Getter byteLength
   * @return {number}
   */
  public get byteLength(): number {
    return this._byteLength;
  }

  /**
   * Getter byteOffset
   * @return {number}
   */
  public get byteOffset(): number {
    return this._byteOffset;
  }

  /**
   * Getter contentEncoding
   * @return {CONTENT_ENCODING | undefined}
   */
  public get contentEncoding(): CONTENT_ENCODING | undefined {
    return this._contentEncoding;
  }

  /**
   * Getter contentType
   * @return {CONTENTTYPE}
   */
  public get contentType(): CONTENTTYPE {
    return this._contentType;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (1)

  public async load(): Promise<any> {
    if (this._data) return this._data;
    const byteLength = this.byteLength || 0;
    const byteOffset = this.byteOffset || 0;
    const arrayBuffer = (await this.buffer.load()).slice(byteOffset, byteOffset + byteLength);

    if (Object.values(CONTENTTYPE).includes(this.contentType) && this.contentType !== CONTENTTYPE.MODEL_VND_3DM) {
      const reader = new FileReader();
      reader.readAsDataURL(new Blob([new Uint8Array(arrayBuffer).buffer], { type: this.contentType }));
      this._data = new Image();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          (this._data as HTMLImageElement).src = <string>reader.result;
          resolve();
        };
      });
      return this._data;
    } else {
      // TODO
      // const bytes = new Uint8Array(this._arrayBuffer);
      // const data = pako.ungzip(bytes);
      // const blob = new Blob([data], { type: this.contentType });

      // const reader = new FileReader();
      // reader.readAsDataURL(blob);
      // const link = document.createElement('a');
      // await new Promise<void>((resolve) => {
      //   reader.onload = function () {
      //     link.href = <string>reader.result;
      //     resolve();
      //   };
      // });
      return this._data;
    }
  }

  // #endregion Public Methods (1)
}