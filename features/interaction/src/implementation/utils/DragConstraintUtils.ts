import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IDragConstraintUtils } from "../../interfaces/utils/IDragConstraintUtils";
import { IDragAnchor } from "../InteractionData";

export class DragConstraintUtils implements IDragConstraintUtils {
    // #region Properties (1)

    private static _instance: DragConstraintUtils;

    // #endregion Properties (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (2)

    /**
     * Intersect the drag constraints with the provided ray.
     * Returns a transformation matrix with the closest drag constraint.
     * 
     * @param dragConstraints 
     * @param viewport 
     * @param node 
     * @param ray 
     * @returns 
     */
    public intersect(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay): { dragConstraint?: IDragConstraint, matrix: mat4, dragAnchor?: IDragAnchor } {
        const dragConstraintResults: { distance: number, transformation: mat4, dragConstraint: IDragConstraint, dragAnchor?: IDragAnchor }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].intersect(viewport, node, ray);
            if(res) dragConstraintResults.push(Object.assign({ dragConstraint: dragConstraints[d] }, res));
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return { dragConstraint: dragConstraintResults[0].dragConstraint, matrix: dragConstraintResults[0].transformation, dragAnchor: dragConstraintResults[0].dragAnchor };        
        } else {
            return { matrix: mat4.create() };
        }
    }

    /**
     * Setup the drag constraints. This function is called whenever a drag event starts.
     * Returns a transformation matrix with the closest drag constraint.
     * 
     * @param dragConstraints 
     * @param viewport 
     * @param node 
     * @param ray 
     * @param intersection 
     * @returns 
     */
    public setup(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { dragConstraint?: IDragConstraint, matrix: mat4, dragAnchor?: IDragAnchor } {
        const dragConstraintResults: { distance: number, transformation: mat4, dragConstraint: IDragConstraint, dragAnchor?: IDragAnchor }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].setup(viewport, node, ray, intersection, previousDragMatrix);
            if(res) dragConstraintResults.push(Object.assign({ dragConstraint: dragConstraints[d] }, res));
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return { dragConstraint: dragConstraintResults[0].dragConstraint, matrix: dragConstraintResults[0].transformation, dragAnchor: dragConstraintResults[0].dragAnchor };        
        } else {
            return { matrix: mat4.create() };
        }
    }

    // #endregion Public Methods (2)
}