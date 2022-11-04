import { container, singleton } from 'tsyringe'
import { CustomData } from '@shapediver/viewer.shared.types'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine'
import { SDTFEngine } from '@shapediver/viewer.data-engine.sdtf-engine'
import { Tag3dEngine } from '@shapediver/viewer.data-engine.tag3d-engine'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Logger, LOGGING_TOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { HTMLElementAnchorEngine } from '@shapediver/viewer.data-engine.html-element-anchor-engine'

import { mat4 } from 'gl-matrix'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'
import { NodeTreeUtils } from '@shapediver/viewer.shared.node-tree-utils'

@singleton()
export class DataEngine {
    // #region Properties (6)

    private readonly _geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
    private readonly _htmlElementAnchorEngine: HTMLElementAnchorEngine = <HTMLElementAnchorEngine>container.resolve(HTMLElementAnchorEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    private readonly _sdtfEngine: SDTFEngine = <SDTFEngine>container.resolve(SDTFEngine);
    private readonly _tag3dEngine: Tag3dEngine = <Tag3dEngine>container.resolve(Tag3dEngine);

    // #endregion Properties (6)

    // #region Public Methods (1)

    public async loadContent(content: ShapeDiverResponseOutputContent, jwtToken?: string): Promise<ITreeNode> {
        if (!content || (content && !content.format)) {
            const error = new ShapeDiverViewerDataProcessingError('DataEngine cannot load content.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `DataEngine.loadContent`, error);
        }

        try {
            let node: ITreeNode;

            if (content.format === 'glb' || content.format === 'gltf') {
                node = await this._geometryEngine.loadContent(content);
            } else if (content.format === 'material') {
                node = await this._materialEngine.loadContent(content);
            } else if (content.format === 'tag2d' || content.format === 'anchor') {
                node = await this._htmlElementAnchorEngine.loadContent(content);
            } else if (content.format === 'tag3d') {
                node = await this._tag3dEngine.loadContent(content);
            } else if (content.format === 'sdtf') {
                node = await this._sdtfEngine.loadContent(content, jwtToken);
            } else {
                node = new TreeNode('custom');
                node.data.push(new CustomData({ ...content }));
            }

            const transformationNode = new TreeNode('transformation');
            if (content.transformations && Array.isArray(content.transformations)) {
                for (let i = 0; i < content.transformations.length; i++) {
                    const t = content.transformations[i];
                    if (Array.isArray(t) && t.length === 16) {
                        const nodeInstance = node.clone();
                        nodeInstance.transformations = [{
                            id: 'content_' + i,
                            matrix: mat4.fromValues(t[0], t[1], t[2], t[3],
                                t[4], t[5], t[6], t[7],
                                t[8], t[9], t[10], t[11],
                                t[12], t[13], t[14], t[15])
                        }].concat(node.transformations);
                        transformationNode.updateVersion()
                        transformationNode.addChild(nodeInstance)
                        NodeTreeUtils.cloneSkinData(node, nodeInstance)
                    }
                }
            } else {
                transformationNode.addChild(node)
            }
            return transformationNode;

        } catch (e) {
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `DataEngine.loadContent`, e);
        }
    }

    // #endregion Public Methods (1)
}