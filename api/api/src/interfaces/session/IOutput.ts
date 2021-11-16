import { ShapeDiverResponseOutput } from '@shapediver/api.geometry-api-dto-v1'
import { TreeNode } from '@shapediver/viewer.shared.node-tree';

export interface IOutput extends ShapeDiverResponseOutput {
    readonly node?: TreeNode;
}