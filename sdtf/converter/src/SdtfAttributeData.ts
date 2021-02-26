import { AbstractTreeNodeData, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { SdtfAttributes, SdtfData as SdtfFileData } from "@shapediver/viewer.sdtf.shared"

export class SdtfAttributeData extends AbstractTreeNodeData {
    constructor(
        private readonly _attributes: SdtfAttributes,
        id?: string
    ) {
        super(id);
    }

    /**
     * Getter data
     * @return {{[key: string]: SdtfFileData<any>}}
     */
    public get data(): { [key: string]: SdtfFileData<any> } {
        return this._attributes.attributes;
    }

    /**
     * Setter data
     * @param {{[key: string]: SdtfFileData<any>}} value
     */
    public set data(value: { [key: string]: SdtfFileData<any> }) {
        this._attributes.attributes = value;
    }


    clone(): ITreeNodeData {
        return new SdtfAttributeData(this._attributes, this.id);
    }
}