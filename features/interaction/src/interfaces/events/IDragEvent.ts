import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportEvent } from "@shapediver/viewer.shared.types";
import { IDragConstraint } from "../utils/IDragConstraint";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionManager } from "../IInteractionManager";

export interface IDragEvent extends IViewportEvent {
    /** The node being dragged. */
    node: ITreeNode,
    /** The transformation matrix that is applied to the dragged node. */
    matrix: mat4,
    /** The intersection point of the ray with the node. Only provided on DRAG_START. */
    intersectionPoint?: vec3,
    /** The ray of the dragging process. Only provided on DRAG_START and DRAG_MOVE and only if it was not a manual dragging. */
    ray?: IRay,
    /** The original event that triggered the dragging. Only provided if it was not a manual dragging. */
    event?: MouseEvent | TouchEvent,
    /** The optional drag constraint that was applied. */
    dragConstraint?: IDragConstraint,
    /** The manager that emitted this event. */
    manager: IInteractionManager
}