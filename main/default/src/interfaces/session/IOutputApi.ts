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
 * The api for an output of a corresponding [session]{@link ISessionApi}.
 * 
 * Outputs represent the channels through which data is output from the model
 * represented by a session. They are computed as part of customizations (see {@link customize}). 
 * 
 * Outputs contain static properties which do not
 * depend on parameter values, these are: 
 * 
 *   * id
 *   * uid
 *   * name
 *   * material
 *   * chunks
 *   * dependency
 *   * order
 *   * tooltip
 *   * displayname
 *   * hidden
 * 
 * The remaining properties are dynamic and may change depending on parameter values.
 * Specifically the _content_ property refers to output assets and embedded data.
 * 
 * Each output has a corresponding {@link node} in the [scene tree]{@link ITree}
 * which represents the data output from the model for the current parameter values.
 * 
 * An output's content can be updated manually by calling the {@link updateOutputContent} method.
 * Using the {@link freeze} property the output's content can be frozen, which means subsequent
 * {@link customize} calls will not update the output.
 */
export interface IOutputApi extends ShapeDiverResponseOutput {
    // #region Properties (3)

    /**
     * The {@link node} corresponding to the output in the [scene tree]{@link ITree}.
     * ATOM: describe what happens in case of freeze. Does this node always correspond to the node in the scene tree?
     */
    readonly node?: ITreeNode;

    /**
     * The freeze flag, when set to true, the output is not updated by the session.
     * ATOM: What exactly happens for frozen outputs?
     */
    freeze: boolean;
    
    /**
     * A callback that is executed whenever an output's {@link node} is to be replaced
     * due to an update of the output's content.
     * Provides the new scene tree node and the old one, so that data can be carried over.
     */
    updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null;

    // #endregion Properties (3)

    // #region Public Methods (1)

    /**
     * Update the output's content, effectively overriding the content which was output from the model.
     * 
     * @param content The new output content.
     * @param preventUpdate Option to not update the output immediately. (default: false) ATOM: to be clarified
     */
    updateOutputContent(content: ShapeDiverResponseOutputContent[], preventUpdate?: boolean): Promise<ITreeNode | undefined>;

    // #endregion Public Methods (1)
}