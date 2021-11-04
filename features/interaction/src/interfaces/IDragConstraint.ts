import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";

export interface IDragConstraint {
    // #region Public Methods (2)

    intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined;
    setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined;

    // #endregion Public Methods (2)
}