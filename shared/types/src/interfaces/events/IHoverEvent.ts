import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IViewerEvent } from "./IViewerEvent";

export interface IHoverEvent extends IViewerEvent {
    // the hovered node
    node: ITreeNode
}