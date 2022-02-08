import { ShapeDiverResponseOutput as ShapeDiverResponseOutputBackend, ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend } from '@shapediver/sdk.geometry-api-sdk-v2';
import { IAnchor, IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, ITag2D, ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree';

export interface ShapeDiverResponseOutput extends ShapeDiverResponseOutputBackend {
    content?: ShapeDiverResponseOutputContent[];
}
export interface ShapeDiverResponseOutputContent extends ShapeDiverResponseOutputContentBackend {
    data?: ITag2D[] | ITag3D[] | IAnchor[] | IMaterialContentData | IMaterialContentDataV1 | IMaterialContentDataV2 | IMaterialContentDataV3 | any;
}

export interface IOutput extends ShapeDiverResponseOutput {
    readonly node?: TreeNode;
    freeze: boolean;

    /**
     * Register a new callback that is called whenever the output node is updated.
     * This can be used to adjust transformation, set visibility or just in general, manipulate the node
     * @param cb 
     */
    addUpdateCallback(cb: (newNode: TreeNode, oldNode: TreeNode) => void): void;

    /**
     * Remove the update callback that was specified.
     */
    removeUpdateCallback(): boolean;

    /**
     * Update the output (used internally)
     * @param newNode 
     * @param oldNode 
     */
    updateOutput(newNode: TreeNode, oldNode: TreeNode): void;

    /**
     * Update the output content with new content
     * @param outputContent 
     */
    updateOutputContent(outputContent: ShapeDiverResponseOutputContent[], preventUpdate?: boolean): Promise<TreeNode | undefined>;
}