import httpClient from "@shapediver/viewer.utils.http-client"

export class SdtfBuffer {
  // #region Properties (1)

  private _arrayBuffer?: ArrayBuffer;

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

  public async load(): Promise<ArrayBuffer> {
    if (this._arrayBuffer) return this._arrayBuffer;

    let result = await httpClient.get(/**this._baseUri + '/' + **/this.uri!, {
      responseType: 'arraybuffer'
    })
    this._arrayBuffer = <ArrayBuffer>result.data;
    return this._arrayBuffer;
  }

  // #endregion Public Methods (1)
}