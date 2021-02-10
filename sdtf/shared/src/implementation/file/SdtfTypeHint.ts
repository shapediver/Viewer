import { GEOMETRYTYPEHINT, PRIMITIVETYPEHINT, RHINOTYPEHINT } from "../../enums";

export class SdtfTypeHint {
  // #region Constructors (1)

  constructor(private readonly _name: PRIMITIVETYPEHINT | GEOMETRYTYPEHINT | RHINOTYPEHINT) {}

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get name(): PRIMITIVETYPEHINT | GEOMETRYTYPEHINT | RHINOTYPEHINT {
    return this._name;
  }

  // #endregion Public Accessors (1)
}