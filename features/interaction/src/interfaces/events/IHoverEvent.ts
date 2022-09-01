import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IViewportEvent } from "@shapediver/viewer.shared.types";
import { IInteractionManager } from "../IInteractionManager";

export interface IHoverEvent extends IViewportEvent {
    /** The node being hovered. */
    node: ITreeNode,
    /** The intersection point of the ray with the node. Only provided on HOVER_ON. */
    intersectionPoint?: vec3,
    /** The ray of the hover process. Only provided on HOVER_ON and only if it was not a manual hovering. */
    ray?: IRay,
    /** The original event that triggered the hovering. Only provided if it was not a manual hovering. */
    event?: MouseEvent | TouchEvent,
    /** The manager that emitted this event. */
    manager: IInteractionManager
}