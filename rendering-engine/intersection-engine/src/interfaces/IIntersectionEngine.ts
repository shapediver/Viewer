import { RENDERER_TYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IIntersection } from "./IIntersection";
import { IIntersectionFilter } from "./IIntersectionFilter";
import { IRay } from "./IRay";

export interface IIntersectionEngine {
    intersect(ray: IRay, filterCriteria?: IIntersectionFilter[], intersectionOptions?: { opacity: number, rendererType: RENDERER_TYPE }, root?: ITreeNode, viewerID?: string): IIntersection[];
}