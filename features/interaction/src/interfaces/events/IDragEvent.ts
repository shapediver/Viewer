import { IViewerEvent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";

export interface IDragEvent extends IViewerEvent {
    node: TreeNode,
    matrix: mat4
}