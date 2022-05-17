import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IViewerEvent } from "./IViewerEvent";

export interface ISelectEvent extends IViewerEvent {
    // the selected node
    node: ITreeNode
}