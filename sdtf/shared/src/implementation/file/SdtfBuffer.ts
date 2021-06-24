import { HttpClient } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';
import { Logger } from '@shapediver/viewer.shared.monitoring';

export class SdtfBuffer {
  // #region Properties (1)

  private _arrayBuffer?: ArrayBuffer;
  private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
  private readonly _logger: Logger = <Logger>container.resolve(Logger);

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(
    private readonly _byteLength: number,
    private readonly _uri?: string,
    private readonly _binaryData?: ArrayBuffer
  ) {
    if (!this._uri)
      this._arrayBuffer = this._binaryData;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (2)

  /**
   * Getter byteLength
   * @return {number}
   */
  public get byteLength(): number {
    return this._byteLength;
  }

  /**
   * Getter uri
   * @return {string | undefined}
   */
  public get uri(): string | undefined {
    return this._uri;
  }

  // #endregion Public Accessors (2)

  // #region Public Methods (1)

  public async load(): Promise<ArrayBuffer | null> {
    if (this._arrayBuffer) return this._arrayBuffer;

    let result;
    try {

      result = await this._httpClient.get(/**this._baseUri + '/' + **/this.uri!, {
        responseType: 'arraybuffer'
      })
    } catch (e) {
      if (e.response && e.response.status) {
          this._logger.httpError(`SdtfBuffer.load: Initial loading of geometry failed.`, e, e.response.status, false)
        } else {
          this._logger.error(`SdtfBuffer.load: Initial loading of geometry failed.`, e, false)
      }
      return null;
    }

    this._arrayBuffer = <ArrayBuffer>result.data;
    return this._arrayBuffer;
  }

  // #endregion Public Methods (1)
}