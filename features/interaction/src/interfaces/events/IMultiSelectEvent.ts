import { IViewerEvent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IMultiSelectEvent extends IViewerEvent {
    // the selected node
    node: TreeNode
    nodes: TreeNode[]
}