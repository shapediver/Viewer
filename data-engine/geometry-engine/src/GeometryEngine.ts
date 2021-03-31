import { TreeNode } from '@shapediver/viewer.shared.node-tree';

import { GLTFLoader as GLTF_v1Loader } from './gltfv1/GLTFLoader';
import { GLTFLoader as GLTF_v2Loader } from './gltfv2/GLTFLoader';
import { container, singleton } from 'tsyringe';
import { ISessionOutputContent } from '@shapediver/viewer.shared.types';
import { Logger } from '@shapediver/viewer.shared.monitoring';

@singleton()
export class GeometryEngine {
    // #region Properties (1)

    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the geometry content into a scene graph node.
     * 
     * @param content the geometry content
     * @returns the scene graph node 
     */
    public async loadContent(content: ISessionOutputContent): Promise<TreeNode> {
        const node = new TreeNode('geometry');
        
        if(!content || (content && !content.href)) {
            this._logger.error('Invalid content was provided to geometry engine.');
            return node;
        }

        if(content.format === 'glb') {
            node.addChild(await new GLTF_v1Loader().load(content.href));
        }
        if(content.format === 'gltf') {
            node.addChild(await new GLTF_v2Loader().load(content.href));
        }
        return node;
    }

    // #endregion Public Methods (1)
}