import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IDragConstraintUtils } from "../../interfaces/utils/IDragConstraintUtils";

@singleton()
export class DragConstraintUtils implements IDragConstraintUtils {
    // #region Public Methods (2)

    public intersect(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay): mat4 {
        const dragConstraintResults: { distance: number, transformation: mat4 }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].intersect(viewer, node, ray);
            if(res) dragConstraintResults.push(res);
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return dragConstraintResults[0].transformation;        
        } else {
            return mat4.create();
        }
    }

    public setup(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection, ): mat4 {
        const dragConstraintResults: { distance: number, transformation: mat4 }[] = [];
        for(let d in dragConstraints) {
            const res = dragConstraints[d].setup(viewer, node, ray, intersection);
            if(res) dragConstraintResults.push(res);
        }

        if(dragConstraintResults.length > 0) {
            dragConstraintResults.sort((a, b) => a.distance - b.distance);
            return dragConstraintResults[0].transformation;        
        } else {
            return mat4.create();
        }
    }

    // #endregion Public Methods (2)
}