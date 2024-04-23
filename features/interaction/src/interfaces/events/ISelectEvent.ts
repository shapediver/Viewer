import { IInteractionManager } from '../IInteractionManager';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportEvent } from '@shapediver/viewer.shared.types';
import { vec3 } from 'gl-matrix';

export interface ISelectEvent extends IViewportEvent {
    // #region Properties (6)

    /** The original event that triggered the selection. Only provided if it was not a manual selection. */
    event?: PointerEvent,
    /** All nodes in the scene tree that share the same groupId and are therefore interacted with at the same time. */
    groupedNodes?: ITreeNode[]
    /** The intersection point of the ray with the node. Only provided on SELECT_ON. */
    intersectionPoint?: vec3,
    /** The manager that emitted this event. */
    manager: IInteractionManager,
    /** The node being selected. */
    node: ITreeNode,
    /** The ray of the selection process. Only provided on SELECT_ON and only if it was not a manual selection. */
    ray?: IRay,

    // #endregion Properties (6)
}