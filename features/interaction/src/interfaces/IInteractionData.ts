import { vec3 } from "gl-matrix";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface IInteractionTypes {
    drag?: boolean,
    hover?: boolean,
    select?: boolean
}

/**
 * InteractionData is used to make a TreeNode interactable.
 * 
 * Via the {@link interactionTypes} the type of interaction that is possible can be specified for the node.
 * Example: Only if the property `drag` in the {@link interactionTypes} is set to `true` it will be possible to drag the node.
 * 
 * If the node is interacted with, the {@link interactionStates} are set to the corresponding types.
 * Example: If the node is dragged, the `drag` property in the {@link interactionStates} is set to `true`.
 * 
 * The {@link dragOrigin} and {@link dragAnchors} are only used when the object is being dragged.
 * The logic for dragging is as follow:
 * - If neither {@link dragOrigin} or {@link dragAnchors} are defined, the intersection point of the ray with the node is used as the origin for dragging.
 * - If a {@link dragOrigin} is defined, but no {@link dragAnchors}, the {@link dragOrigin} is used as the origin for dragging.
 * - If at least one anchor is defined in {@link dragAnchors}, the {@link dragAnchors} are used for dragging. 
 *   In that case, the anchors are positioned accoriding to the drag transformation and then transformed with the rotation that has been provided.
 *   The transformed result is used to measure the distance to the ray, and the closest distanced anchor of the {@link dragAnchors} is chosen to compute the tranformation matrix that is applied to the node.
 * 
 * The calculations that are mentioned above happen in close proximity with the {@link IDragConstraint}s.
 * As this is not the easiest of topics, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1). There we explain the process to set this up with many examples.
 */
export interface IInteractionData extends ITreeNodeData {
    // #region Properties (4)

    /**
     * The drag anchors can be defined as various points in space that will be transformed according to the node matrix that this data item belongs to.
     * These anchors are used when an object is being dragged instead of the {@link dragOrigin} or the default, the intersection with the node.
     * 
     * The optional rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) is being applied to the node if the specified drag anchor has been used.
     */
    dragAnchors: {
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[]
    /**
     * The drag origin can be defined instead of usind the default, the intersection with the node, as a dragging origin.
     * If at least one {@link dragAnchors} is used, this property will be ignored.
     */
    dragOrigin?: vec3;
    /**
     * The keys should respond to the ones in the interactionType.
     * They represent the current state of the interactions.
     */
    interactionStates: IInteractionTypes;
    /**
     * The types of interactions that are activated for this node.
     */
    interactionTypes: IInteractionTypes;

    // #endregion Properties (4)

    // #region Public Methods (1)

    clone(): IInteractionData;

    // #endregion Public Methods (1)
}