import { ShapeDiverResponseOutput } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { ShapeDiverResponseOutputContent } from '@shapediver/viewer.session-engine.session-engine';

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
 * which represents the data that got output from the model for the parameter values
 * stored in {@link IParameterApi.sessionValue}.
 * 
 * An output's content can be updated manually by calling the {@link updateOutputContent} method.
 * Using the {@link freeze} property the output's content can be frozen, which means subsequent
 * {@link customize} calls will not update the output.
 */
export interface IOutputApi extends ShapeDiverResponseOutput {
    // #region Properties (3)

    /**
     * The {@link node} corresponding to the output in the [scene tree]{@link ITree}.
     */
    readonly node?: ITreeNode;

    /**
     * The format of the items in the content array.
     */
    readonly format: string[];

    /**
     * The freeze flag. 
     * When set to true, calls to the following functions will not update the output: 
     * 
     *   * {@link updateOutputContent}
     *   * {@link ISessionApi.customize}
     *   * {@link ISessionApi.updateOutputs}
     */
    freeze: boolean;
    
    /**
     * A callback that is executed whenever an output's {@link node} is to be replaced
     * due to an update of the output's content.
     * Provides the new scene tree node and the old one, so that data can be carried over.
     */
    updateCallback: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null;

    // #endregion Properties (3)

    // #region Public Methods (1)

    /**
     * Update the output's content, effectively overriding the content which was output from the model.
     * 
     * This can be used to override the content which was output from the model (e.g. materials). 
     * In case you want the override content to persist further calls to {@link ISessionApi.customize}, 
     * await the call to this function and then set {@link freeze} to true.
     * 
     * @param content The new output content.
     * @param preventUpdate Option to not update the output immediately (default: false). Use this to update
     *                      the content of several outputs at the same time, then call {@link ISessionApi.updateOutputs}.
     */
    updateOutputContent(content: ShapeDiverResponseOutputContent[], preventUpdate?: boolean): Promise<ITreeNode | undefined>;

    // #endregion Public Methods (1)
}