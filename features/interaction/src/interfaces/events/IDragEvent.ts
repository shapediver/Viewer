import { IViewerEvent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";

export interface IDragEvent extends IViewerEvent {
    // the dragged node
    node: TreeNode,
    // the applied matrix
    matrix: mat4
}