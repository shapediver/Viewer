import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportEvent } from '@shapediver/viewer.shared.types';
import { mat4 } from 'gl-matrix';

/**
 * Definition of the gumball event.
 * These events are sent for gumball specific events ({@link EVENTTYPE_GUMBALL}).
 */
export interface IGumballEvent extends IViewportEvent {
    // #region Properties (2)

    /** 
     * The currently used matrix.
     */
    transformations: mat4[],
    /** 
     * All currently selected nodes. 
     */
    nodes: ITreeNode[],
    /**
     * The local transformations.
     * This is the transformation that is applied to the nodes, with the inverted initial transformations for single nodes and the multiplied initial transformations for multiple nodes.
     */
    localTransformations: mat4[]

    // #endregion Properties (2)
}