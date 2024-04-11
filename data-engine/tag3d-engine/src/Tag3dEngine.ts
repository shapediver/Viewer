import { CustomData } from '@shapediver/viewer.shared.types';
import { ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ShapeDiverViewerDataProcessingError, StateEngine } from '@shapediver/viewer.shared.services';

export class Tag3dEngine {
    // #region Properties (3)

    private readonly _stateEngine: StateEngine = StateEngine.instance;

    private static _instance: Tag3dEngine;

    #geometryCreator: ((tag3dInfo: ITag3D) => ITreeNode | undefined) | undefined;

    // #endregion Properties (3)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Getters And Setters (2)

    public get geometryCreator() {
        return this.#geometryCreator;
    }

    public set geometryCreator(value: ((tag3dInfo: ITag3D) => ITreeNode | undefined) | undefined) {
        this.#geometryCreator = value;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (1)

    /**
     * Load the tag3d content into a scene graph node.
     * 
     * @param content the tag3d content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        const node = new TreeNode('tag3d');

        if (this._stateEngine.fontLoaded.resolved === false)
            await this._stateEngine.fontLoaded;

        if (!content)
            throw new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: Invalid content was provided to tag3d engine.');

        if (content.data && Array.isArray(content.data)) {
            if (this.#geometryCreator) {
                for (let i = 0; i < content.data.length; i++) {
                    const tag3dInfo: ITag3D = content.data[i];
                    const child = this.#geometryCreator(tag3dInfo);
                    if (child) node.addChild(child);
                }
            } else {
                const customData = new CustomData({});
                for (let i = 0; i < content.data.length; i++) {
                    const tag3dInfo: ITag3D = content.data[i];
                    customData.data['tag3d_' + tag3dInfo.version] = tag3dInfo;
                }
                node.addData(customData);
            }
        } else {
            throw new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: No tag3d data was provided to tag3d engine.');
        }
        return node;
    }

    // #endregion Public Methods (1)
}