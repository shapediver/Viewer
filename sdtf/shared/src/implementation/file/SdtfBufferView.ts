import { ungzip } from 'pako'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'

import { CONTENT_ENCODING, CONTENTTYPE } from '../../enums'
import { SdtfBuffer } from './SdtfBuffer'

export class SdtfBufferView {
  // #region Properties (1)

  private _data?: any;
  private readonly _logger: Logger = <Logger>container.resolve(Logger);

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
    const buffer = await this.buffer.load();
    if(!buffer) return null;

    const arrayBuffer = buffer.slice(byteOffset, byteOffset + byteLength);

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
      this._logger.error(LOGGINGTOPIC.SDTF, new SDError('SdtfBufferView.load: The MIME type "model/vnd.3dm" is currently not implemented.'));
      return null;
      // const bytes = new Uint8Array(arrayBuffer);
      // const data = ungzip(bytes);
      // const blob = new Blob([data], { type: this.contentType });

      // const reader = new FileReader();
      // reader.readAsDataURL(blob);
      // const link = document.createElement('a');
      // await new Promise<void>((resolve) => {
      //   reader.onload = () => {
      //     link.href = <string>reader.result;
      //     this._data = link;
      //     resolve();
      //   };
      // });
      // return this._data;
    }
  }

  // #endregion Public Methods (1)
}