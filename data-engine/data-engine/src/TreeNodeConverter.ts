import { TreeNode, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { SdtfAttributes, SdtfChunk, SdtfData as SdtfFileData, SdtfFile, SdtfNode } from "@shapediver/viewer.sdtf.shared";
import { SdtfAttributeData, SdtfItemData } from "@shapediver/viewer.sdtf.converter";

export class TreeNodeConverter {
    // #region Public Methods (2)

    // public convertToSdtfFile(node: TreeNode): SdtfFile {       
    //     throw new Error();
    // }

    public convertToTreeNode(file: SdtfFile): TreeNode {
        const root = new TreeNode("sdtf");
        for (let i = 0; i < file.chunks.length; i++)
            root.addChild(this.convertNodeClassToTreeNode(file.chunks[i]));
        return root;
    }

    // #endregion Public Methods (2)

    // #region Private Methods (3)

    private convertAttributesClassToAttributeData(attributes: SdtfAttributes): ITreeNodeData {
        return new SdtfAttributeData(attributes);
    }

    private convertItemClassToItemData(item: SdtfFileData<any>): ITreeNodeData {
        return new SdtfItemData<typeof item.data>(item);
    }

    private convertNodeClassToTreeNode(node: SdtfChunk | SdtfNode): TreeNode {
        const parentNode = new TreeNode(node.name || (node instanceof SdtfChunk ? 'chunk' : 'node'));

        // load data items
        if (node.items)
            for (let i = 0; i < node.items.length; i++)
                parentNode.data.push(this.convertItemClassToItemData(node.items[i]));

        if (node.attributes)
            parentNode.data.push(this.convertAttributesClassToAttributeData(node.attributes));

        // load child nodes
        for (let i = 0; i < node.nodes.length; i++)
            parentNode.addChild(this.convertNodeClassToTreeNode(node.nodes[i]));

        return parentNode;
    }

    // #endregion Private Methods (3)
}