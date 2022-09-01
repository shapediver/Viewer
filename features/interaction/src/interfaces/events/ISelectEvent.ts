import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { IViewportEvent } from "@shapediver/viewer.shared.types";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionManager } from "../IInteractionManager";

export interface ISelectEvent extends IViewportEvent {
    /** The node being selected. */
    node: ITreeNode,
    /** The intersection point of the ray with the node. Only provided on SELECT_ON. */
    intersectionPoint?: vec3,
    /** The ray of the selection process. Only provided on SELECT_ON and only if it was not a manual selection. */
    ray?: IRay,
    /** The original event that triggered the selection. Only provided if it was not a manual selection. */
    event?: MouseEvent | TouchEvent,
    /** The manager that emitted this event. */
    manager: IInteractionManager
}