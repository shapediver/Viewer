import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";

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
    intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined;
    
    /**
     * Setup the current drag constraint and return the first intersection.
     * 
     * @param viewer 
     * @param node 
     * @param ray 
     * @param intersection 
     */
    setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined;

    // #endregion Public Methods (2)
}