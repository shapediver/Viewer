import { mat4 } from "gl-matrix";
import { ITreeNode, IViewportApi } from "@shapediver/viewer";
import { IDragConstraint } from "./IDragConstraint";
import { IIntersection, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";

export interface IDragConstraintUtils {
    // #region Public Methods (2)

    /**
     * Intersect the provided drag constraints with the ray provided.
     * Returns a matrix with the transformation of the node.
     * The selection of the drag constraint works by taking the one with the closest distance to the ray.
     * 
     * It returns the dragConstraints that were used and the matrix that was calculated.
     * If no dragConstraint was used, this entry is left empty.
     * 
     * @param dragConstraints 
     * @param viewer 
     * @param node 
     * @param ray 
     * @returns
     */
    intersect(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay): { dragConstraint?: IDragConstraint, matrix: mat4 };
    /**
     * Setup the provided drag constraints.
     * The drag origin is set here and a first computation of the matrix is done.
     * 
     * It returns the dragConstraints that were used and the matrix that was calculated.
     * If no dragConstraint was used, this entry is left empty.
     * 
     * @param dragConstraints 
     * @param viewer 
     * @param node 
     * @param ray 
     * @param intersection 
     * @param previousDragMatrix 
     * @returns
     */
    setup(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { dragConstraint?: IDragConstraint, matrix: mat4 };

    // #endregion Public Methods (2)
}