import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IViewportEvent } from "@shapediver/viewer.shared.types";

export interface IHoverEvent extends IViewportEvent {
    /** The node of the hover event. */
    node: ITreeNode,
    /** The intersection point of the hovering. Only provided on HOVER_ON. */
    intersectionPoint?: vec3,
    /** The ray of the hover process. Only provided on HOVER_ON and only if it was not a manual hovering. */
    ray?: IRay,
    /** The original event that triggered the hovering. Only provided if it was not a manual hovering. */
    event?: MouseEvent | TouchEvent
}