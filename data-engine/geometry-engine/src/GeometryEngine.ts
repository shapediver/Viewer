import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

import { GLTFLoader as GLTF_v1Loader } from './gltfv1/GLTFLoader';
import { GLTFLoader as GLTF_v2Loader } from './gltfv2/GLTFLoader';
import { singleton } from 'tsyringe';
import { SessionOutputContent } from '@shapediver/viewer.shared.types';

@singleton()
export class GeometryEngine {
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
    public async loadContent(content: SessionOutputContent): Promise<TreeNode> {
        const node = new TreeNode('geometry');
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