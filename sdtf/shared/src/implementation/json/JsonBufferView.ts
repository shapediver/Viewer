export interface JsonBufferView {
    // #region Properties (6)

    buffer: number;
    byteLength: number;
    byteOffset: number;
    contentEncoding?: string;
    contentType: string;
    name?: string;

    // #endregion Properties (6)
}