import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IViewportEvent } from "./IViewportEvent";

export interface ISelectEvent extends IViewportEvent {
    // the selected node
    node: ITreeNode,
    intersectionPoint?: vec3
}