import { vec3 } from "gl-matrix";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IIntersection {
    /** The distance to the intersection. */
    distance: number,
    /** The point of intersection. */
    point: vec3,
    /** The intersected node. */
    node: ITreeNode
}