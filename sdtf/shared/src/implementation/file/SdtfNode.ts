import { SdtfAttributes } from "./data/attributes/SdtfAttributes";
import { AbstractSdtfData } from "./data/AbstractSdtfData";
import { SdtfTypeHint } from "./SdtfTypeHint";

export class SdtfNode {
  // #region Constructors (1)

  constructor(
    private readonly _items: AbstractSdtfData<any>[] = [],
    private _nodes: SdtfNode[] = [],
    private readonly _attributes?: SdtfAttributes,
    private readonly _name?: string,
    private readonly _typeHint?: SdtfTypeHint,
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  /**
   * Getter attributes
   * @return {SdtfAttributes | undefined}
   */
  public get attributes(): SdtfAttributes | undefined {
    return this._attributes;
  }

  /**
   * Getter items
   * @return {AbstractSdtfData<any>[]}
   */
  public get items(): AbstractSdtfData<any>[] {
    return this._items;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Getter nodes
   * @return {SdtfNode[] }
   */
  public get nodes(): SdtfNode[] {
    return this._nodes;
  }

  /**
   * Setter nodes
   * @param nodes
   */
  public set nodes(nodes: SdtfNode[]) {
    this._nodes = nodes;
  }

  /**
   * Getter typeHint
   * @return {SdtfTypeHint | undefined}
   */
  public get typeHint(): SdtfTypeHint | undefined {
    return this._typeHint;
  }

  // #endregion Public Accessors (6)
}