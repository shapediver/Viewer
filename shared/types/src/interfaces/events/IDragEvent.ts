import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";
import { IViewerEvent } from "./IViewerEvent";

export interface IDragEvent extends IViewerEvent {
    // the dragged node
    node: ITreeNode,
    // the applied matrix
    matrix: mat4
}