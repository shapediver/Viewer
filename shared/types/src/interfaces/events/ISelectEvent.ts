import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IViewportEvent } from "./IViewportEvent";

export interface ISelectEvent extends IViewportEvent {
    // the selected node
    node: ITreeNode
}