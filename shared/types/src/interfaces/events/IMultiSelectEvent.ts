import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { IViewerEvent } from "./IViewerEvent";

export interface IMultiSelectEvent extends IViewerEvent {
    // the selected node
    node: ITreeNode
    nodes: ITreeNode[]
}