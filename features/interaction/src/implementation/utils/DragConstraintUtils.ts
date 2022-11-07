import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IDragConstraintUtils } from "../../interfaces/utils/IDragConstraintUtils";

@singleton()
export class DragConstraintUtils implements IDragConstraintUtils {
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
    public intersect(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay): { dragConstraint?: IDragConstraint, matrix: mat4 } {
        const dragConstraintResults: { distance: number, transformation: mat4, dragConstraint: IDragConstraint }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].intersect(viewport, node, ray);
            if(res) dragConstraintResults.push(Object.assign({ dragConstraint: dragConstraints[d] }, res));
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return { dragConstraint: dragConstraintResults[0].dragConstraint, matrix: dragConstraintResults[0].transformation };        
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
    public setup(dragConstraints: { [key: string]: IDragConstraint }, viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { dragConstraint?: IDragConstraint, matrix: mat4 } {
        const dragConstraintResults: { distance: number, transformation: mat4, dragConstraint: IDragConstraint }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].setup(viewport, node, ray, intersection, previousDragMatrix);
            if(res) dragConstraintResults.push(Object.assign({ dragConstraint: dragConstraints[d] }, res));
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return { dragConstraint: dragConstraintResults[0].dragConstraint, matrix: dragConstraintResults[0].transformation };        
        } else {
            return { matrix: mat4.create() };
        }
    }

    // #endregion Public Methods (2)
}