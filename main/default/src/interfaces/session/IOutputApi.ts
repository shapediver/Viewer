import { ShapeDiverResponseOutput, ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend } from '@shapediver/sdk.geometry-api-sdk-v2';
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
 * The api for an output of the corresponding [session]{@link ISessionApi}.
 * An output can be updated manually by calling the {@link updateOutputContent} method.
 * With the {@link freeze} property the output can be frozen and the content can not be changed anymore.
 */
export interface IOutputApi extends ShapeDiverResponseOutput {
    // #region Properties (3)

    /**
     * The node that is used to display the output.
     */
    readonly node?: ITreeNode;

    /**
     * The freeze flag, when set to true, the output is not updated by the session.
     */
    freeze: boolean;
    
    /**
     * A callback that is executed when the output is changed.
     * Provides the new scene tree node and the old ones, so that properties can be updated.
     */
    updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null;

    // #endregion Properties (3)

    // #region Public Methods (1)

    /**
     * Update the output content with new content
     * 
     * @param outputContent The new output content.
     * @param preventUpdate Option to not update the output immediately. (default: false)
     */
    updateOutputContent(outputContent: ShapeDiverResponseOutputContent[], preventUpdate?: boolean): Promise<ITreeNode | undefined>;

    // #endregion Public Methods (1)
}