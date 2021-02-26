import { AbstractTreeNodeData, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { SdtfData as SdtfFileData } from "@shapediver/viewer.sdtf.shared"
import { SdtfAttributeData } from "./SdtfAttributeData";

export class SdtfItemData<T> extends AbstractTreeNodeData {

  private _attributes?: SdtfAttributeData;

  constructor(
    private readonly _item: SdtfFileData<T>,
    id?: string
  ) {
    super(id);
    if(this._item.attributes)
      this._attributes = new SdtfAttributeData(this._item.attributes);
  }

  /**
   * Getter data
   * @return {SdtfAttributeData | undefined}
   */
  public get attributes(): SdtfAttributeData | undefined {
    return this._attributes;
  }

  /**
   * Setter data
   * @param {SdtfAttributeData | undefined} value
   */
  public set attributes(value: SdtfAttributeData | undefined) {
    this._attributes = value;
  }

  /**
   * Getter data
   * @return {Promise<T>}
   */
  public get data(): Promise<T> {
    return this._item.data;
  }

  /**
   * Setter data
   * @param {Promise<T>} value
   */
  public set data(value: Promise<T>) {
    this._item.data = value;
  }


  clone(): ITreeNodeData {
    return new SdtfItemData(this._item, this.id);
  }
}