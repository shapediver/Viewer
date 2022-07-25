import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IViewportEvent } from "./IViewportEvent";

export interface IMultiSelectEvent extends IViewportEvent {
    // the selected node
    node: ITreeNode
    nodes: ITreeNode[],
    intersectionPoint?: vec3
}