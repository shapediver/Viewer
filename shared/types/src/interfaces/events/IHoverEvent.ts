import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IViewportEvent } from "./IViewportEvent";

export interface IHoverEvent extends IViewportEvent {
    // the hovered node
    node: ITreeNode
}