import { vec3 } from "gl-matrix";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

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
    interactionStates: {
        [key: string]: boolean
    };
    // The types of interactions that are activated for this node.
    interactionTypes: {
        [key: string]: boolean
    };

    // #endregion Properties (4)
}