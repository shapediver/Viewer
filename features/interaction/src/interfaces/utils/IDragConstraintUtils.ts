import { mat4 } from "gl-matrix";
import { IViewer, TreeNode } from "@shapediver/viewer";
import { IDragConstraint } from "./IDragConstraint";
import { IIntersection, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";

export interface IDragConstraintUtils {
    intersect(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay): mat4;
    setup(dragConstraints: { [key: string]: IDragConstraint }, viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): mat4;
}