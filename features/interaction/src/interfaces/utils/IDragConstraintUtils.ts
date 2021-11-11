import { mat4 } from "gl-matrix";
import { IViewer, TreeNode } from "@shapediver/viewer";
import { IDragConstraint } from "./IDragConstraint";
import { IIntersection, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";

export interface IDragConstraintUtils {
    // #region Public Methods (2)

    /**
     * Intersect the provided drag constraints with the ray provided.
     * Returns a matrix with the transformation of the node.
     * The selection of the drag constraint works by taking the one with the closest distance to the ray.
     * 
     * @param dragConstraints 
     * @param viewer 
     * @param node 
     * @param ray 
     * @returns
     */
    intersect(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay): mat4;
    /**
     * Setup the provided drag constraints.
     * The drag origin is set here and a first computation of the matrix is done.
     * 
     * @param dragConstraints 
     * @param viewer 
     * @param node 
     * @param ray 
     * @param intersection 
     * @returns
     */
    setup(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): mat4;

    // #endregion Public Methods (2)
}