import { SdtfTypeHint } from './implementation/file/SdtfTypeHint'
import { SdtfChunk } from './implementation/file/SdtfChunk'

/**
 * Main class for the representation of an Sdtf file.
 * Contains chunks, typeHints and the version.
 */
export class SdtfFile {
  // #region Constructors (1)

  constructor(
    private readonly _chunks: SdtfChunk[] = [],
    private readonly _typeHints: SdtfTypeHint[] = []
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (3)

  /**
   * Getter chunks
   * @return {SdtfChunk[]}
   */
  public get chunks(): SdtfChunk[] {
    return this._chunks;
  }

  /**
   * Getter typeHints
   * @return {SdtfTypeHint[]}
   */
  public get typeHints(): SdtfTypeHint[] {
    return this._typeHints;
  }

  // #endregion Public Accessors (3)
}