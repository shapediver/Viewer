import { SdtfAccessor } from '../SdtfAccessor'
import { PRIMITIVETYPEHINT } from '../../../enums'
import { AbstractSdtfData } from './AbstractSdtfData'
import { SdtfCustomItem } from './items/SdtfCustomItem'
import { SdtfPrimitiveItem } from './items/SdtfPrimitiveItem'
import { SdtfAttributes } from './attributes/SdtfAttributes'
import { SdtfTypeHint } from '../SdtfTypeHint'
import { SdtfAttribute } from './attributes/SdtfAttribute'

export class SdtfDataFactory {

  // #region Public Methods (1)

  /**
   * Create an sdtf item with the corresponding type.
   * For primitive types there are special versions, for complex types some are unified
   * 
   * @param typeHint 
   * @param accessor 
   * @param attributes 
   * @param value 
   */
  public createItem(
    typeHint: SdtfTypeHint,
    accessor?: SdtfAccessor,
    value?: any,
    attributes?: SdtfAttributes
  ): AbstractSdtfData<any> {
    switch (true) {
      case typeHint.name === PRIMITIVETYPEHINT.BOOL:
        return new SdtfPrimitiveItem<boolean>(typeHint, accessor, value, attributes);
      case typeHint.name === PRIMITIVETYPEHINT.DOUBLE ||
        typeHint.name === PRIMITIVETYPEHINT.FLOAT ||
        typeHint.name === PRIMITIVETYPEHINT.DECIMAL ||
        typeHint.name === PRIMITIVETYPEHINT.INT:
        return new SdtfPrimitiveItem<number>(typeHint, accessor, value, attributes);
      case typeHint.name === PRIMITIVETYPEHINT.STRING:
        return new SdtfPrimitiveItem<string>(typeHint, accessor, value, attributes);
      default:
        return new SdtfCustomItem(typeHint, accessor, value, attributes);
    }
  }

  
  /**
   * Create an sdtf attribute with the corresponding type.
   * For primitive types there are special versions, for complex types some are unified
   * 
   * @param typeHint 
   * @param accessor 
   * @param value 
   */
  public createAttribute(
    typeHint: SdtfTypeHint,
    accessor?: SdtfAccessor,
    value?: any
  ): AbstractSdtfData<any> {
    return new SdtfAttribute(typeHint, accessor, value);
  }

  // #endregion Public Methods (1)
}