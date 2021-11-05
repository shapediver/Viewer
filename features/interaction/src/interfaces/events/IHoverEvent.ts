import { IViewerEvent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IHoverEvent extends IViewerEvent {
    node: TreeNode
}