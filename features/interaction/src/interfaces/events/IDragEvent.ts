import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportEvent } from "@shapediver/viewer.shared.types";
import { IDragConstraint } from "../utils/IDragConstraint";
import { IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";

export interface IDragEvent extends IViewportEvent {
    /** The node of the drag event. */
    node: ITreeNode,
    /** The applied matrix transformation matrix. */
    matrix: mat4,
    /** The intersection point of the selection. Only provided on SELECT_ON. */
    intersectionPoint?: vec3,
    /** The ray of the selection process. Only provided on SELECT_ON and only if it was not a manual selection. */
    ray?: IRay,
    /** The original event that triggered the selection. Only provided if it was not a manual selection. */
    event?: MouseEvent | TouchEvent,
    /** The optional drag constraint that was used in the drag event. */
    dragConstraint?: IDragConstraint
}