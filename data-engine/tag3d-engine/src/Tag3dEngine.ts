import { CustomData } from '@shapediver/viewer.shared.types';
import { GlobalAccessObjects } from '@shapediver/viewer.shared.global-access-objects';
import { ITag3D } from '@shapediver/viewer.data-engine.shared-types';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ShapeDiverViewerDataProcessingError, StateEngine } from '@shapediver/viewer.shared.services';

export class Tag3dEngine {
    // #region Properties (3)

    private readonly _globalAccessObjects: GlobalAccessObjects = GlobalAccessObjects.instance;
    private readonly _stateEngine: StateEngine = StateEngine.instance;

    private static _instance: Tag3dEngine;

    // #endregion Properties (3)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Methods (1)

    /**
     * Load the tag3d content into a scene graph node.
     * 
     * @param content the tag3d content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        const node = new TreeNode('tag3d');

        if (!content)
            throw new ShapeDiverViewerDataProcessingError('Tag3dEngine.loadContent: Invalid content was provided to tag3d engine.');

        if (content.data && Array.isArray(content.data)) {
            if (this._globalAccessObjects.loadTag3D) {
                for (let i = 0; i < content.data.length; i++) {
                    const tag3dInfo: ITag3D = content.data[i];
                    const child = this._globalAccessObjects.loadTag3D(tag3dInfo);
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