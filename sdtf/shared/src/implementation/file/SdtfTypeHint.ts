import { GEOMETRY_TYPEHINT, PRIMITIVE_TYPEHINT, RHINO_TYPEHINT } from "../../enums";

export class SdtfTypeHint {
  // #region Constructors (1)

  constructor(private readonly _name: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | RHINO_TYPEHINT) {}

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get name(): PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | RHINO_TYPEHINT {
    return this._name;
  }

  // #endregion Public Accessors (1)
}