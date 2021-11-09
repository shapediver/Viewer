import { vec3 } from "gl-matrix";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface IInteractionData extends ITreeNodeData {
    interactionTypes: { 
        [key: string]: boolean 
    };
    interactionStates: { 
        [key: string]: boolean 
    };
    dragOrigin?: vec3;
    dragAnchors: {
        position: vec3,
        rotation?: {
            axis: vec3,
            angle: number
        }
    }[]
}