import { vec3 } from "gl-matrix";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IIntersection {
    distance: number,
    point: vec3,
    node: TreeNode
}