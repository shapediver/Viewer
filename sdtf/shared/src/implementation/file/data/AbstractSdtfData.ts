import { SdtfAccessor } from '../SdtfAccessor'
import { SdtfAttributes } from './attributes/SdtfAttributes'
import { SdtfTypeHint } from '../SdtfTypeHint'

export abstract class AbstractSdtfData<T> {
  // #region Constructors (1)

  constructor(
    protected readonly _typeHint: SdtfTypeHint,
    protected readonly _accessor?: SdtfAccessor,
    protected _value?: any,
    protected _attributes?: SdtfAttributes
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (4)

  public get accessor(): SdtfAccessor | undefined {
    return this._accessor;
  }

  public get attributes(): SdtfAttributes | undefined {
    return this._attributes;
  }

  public set attributes(value: SdtfAttributes | undefined) {
    this._attributes = value;
  }

  public get typeHint(): SdtfTypeHint {
    return this._typeHint;
  }

  public get value(): any | undefined {
    return this._value;
  }

  // #endregion Public Accessors (4)

  // #region Public Abstract Accessors (2)

  public abstract get data(): Promise<T>;
  public abstract set data(data: Promise<T>);

  // #endregion Public Abstract Accessors (2)
}