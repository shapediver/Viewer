import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";
import { IViewportEvent } from "./IViewportEvent";

export interface IDragEvent extends IViewportEvent {
    // the dragged node
    node: ITreeNode,
    // the applied matrix
    matrix: mat4
}