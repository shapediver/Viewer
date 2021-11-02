import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IIntersectionFilter {
    (node: TreeNode): boolean;
}
