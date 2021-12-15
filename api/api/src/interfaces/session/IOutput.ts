import { ShapeDiverResponseOutput } from '@shapediver/sdk.geometry-api-sdk-v2';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';

export interface IOutput extends ShapeDiverResponseOutput {
    readonly node?: TreeNode;
}