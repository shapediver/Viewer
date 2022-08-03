import { vec3 } from "gl-matrix";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface IInteractionTypes {
    drag?: boolean,
    hover?: boolean,
    select?: boolean
}

export interface IInteractionData extends ITreeNodeData {
    // #region Properties (4)

    // Property to specify drag anchors.
    // These anchors must have a position and can have an orientation (provided in axis-angle form).
    dragAnchors: {
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[]
    // Property to specify a specific drag origin.
    dragOrigin?: vec3;
    // The keys should respond to the ones in the interactionType. 
    // They represent the current state of the interactions.
    interactionStates: IInteractionTypes;
    // The types of interactions that are activated for this node.
    interactionTypes: IInteractionTypes;

    // #endregion Properties (4)

    // #region Public Methods (1)

    clone(): IInteractionData;

    // #endregion Public Methods (1)
}