import { ITreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IIntersectionFilter {
    (node: ITreeNode): boolean;
}
