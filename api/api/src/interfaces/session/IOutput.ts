import { ShapeDiverResponseOutput as ShapeDiverResponseOutputBackend, ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend } from '@shapediver/sdk.geometry-api-sdk-v2';
import { IAnchor, IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, ITag2D, ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';

export interface ShapeDiverResponseOutput extends ShapeDiverResponseOutputBackend {
    content?: ShapeDiverResponseOutputContent[];
}
export interface ShapeDiverResponseOutputContent extends ShapeDiverResponseOutputContentBackend {
    data?: ITag2D[] | ITag3D[] | IAnchor[] | IMaterialContentData | IMaterialContentDataV1 | IMaterialContentDataV2 | IMaterialContentDataV3 | any;
}

export interface IOutput extends ShapeDiverResponseOutput {
    readonly node?: TreeNode;

    /**
     * Update the output (used internally)
     * @param outputDef 
     */
    updateOutput(): void;
    /**
     * Update the output content with new content
     * @param outputContent 
     */
    updateOutputContent(outputContent: ShapeDiverResponseOutputContent[]): void;
}