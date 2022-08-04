import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IViewportEvent } from "@shapediver/viewer.shared.types";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";

export interface IMultiSelectEvent extends IViewportEvent {
    /** The node of the selection event. */
    node: ITreeNode,
    /** All currently selected nodes. */
    nodes: ITreeNode[],
    /** The intersection point of the selection. Only provided on SELECT_ON. */
    intersectionPoint?: vec3,
    /** The ray of the selection process. Only provided on SELECT_ON and only if it was not a manual selection. */
    ray?: IRay, 
    /** The original event that triggered the selection. Only provided if it was not a manual selection. */
    event?: MouseEvent | TouchEvent
}