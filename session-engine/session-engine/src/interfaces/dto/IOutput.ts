import { ShapeDiverResponseOutput, ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend, ShapeDiverResponseOutputChunk as ShapeDiverResponseOutputChunkBackend } from '@shapediver/sdk.geometry-api-sdk-v2';
import { IAnchor, IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, ITag2D, ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';

/**
 * Extension of the ShapeDiverResponseOutputContent as the viewer already creates types for them
 */
export interface ShapeDiverResponseOutputContent extends ShapeDiverResponseOutputContentBackend {
    // #region Properties (1)

    data?: ITag2D[] | ITag3D[] | IAnchor[] | IMaterialContentData | IMaterialContentDataV1 | IMaterialContentDataV2 | IMaterialContentDataV3 | any;

    // #endregion Properties (1)
}

/**
 * Extension of the ShapeDiverResponseOutputChunk with a node
 */
export interface ShapeDiverResponseOutputChunk extends ShapeDiverResponseOutputChunkBackend {
    // #region Properties (1)

    node?: ITreeNode;

    // #endregion Properties (1)
}

export interface IOutput extends ShapeDiverResponseOutput {
    // #region Properties (3)

    readonly node?: ITreeNode;

    format: string[];
    freeze: boolean;
    updateCallback: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null;

    // #endregion Properties (3)

    // #region Public Methods (1)
    
    updateOutput(newNode?: ITreeNode, oldNode?: ITreeNode): void;
    updateOutputContent(content: ShapeDiverResponseOutputContent[], preventUpdate?: boolean): Promise<ITreeNode | undefined>;
    updateOutputDefinition(outputDef: ShapeDiverResponseOutput): void;

    // #endregion Public Methods (1)
}