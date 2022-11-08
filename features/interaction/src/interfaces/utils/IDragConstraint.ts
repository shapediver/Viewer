import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";

export interface IDragConstraint {
    // #region Public Methods (2)

    /**
     * Intersect the drag constraint with the ray provided.
     * Returns the distance to the drag constraint and the transformation matrix calculated.
     * 
     * @param viewer 
     * @param node 
     * @param ray 
     * @returns
     */
    intersect(viewport: IViewportApi, node: ITreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined;
    
    /**
     * Setup the current drag constraint and return the first intersection.
     * 
     * @param viewer 
     * @param node 
     * @param ray 
     * @param intersection 
     * @param previousDragMatrix 
     */
    setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { distance: number, transformation: mat4 } | undefined;

    // #endregion Public Methods (2)
}