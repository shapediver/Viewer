import { IViewerEvent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IHoverEvent extends IViewerEvent {
    // the hovered node
    node: TreeNode
}