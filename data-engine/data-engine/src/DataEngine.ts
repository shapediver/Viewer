import { container, singleton } from 'tsyringe'
import { CustomData } from '@shapediver/viewer.shared.types'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine'
import { Tag3dEngine } from '@shapediver/viewer.data-engine.tag3d-engine'
import { ITransformation, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Reader } from '@shapediver/viewer.sdtf.converter'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { HTMLElementAnchorEngine } from '@shapediver/viewer.data-engine.html-element-anchor-engine'
import { ShapeDiverResponseOutputPart } from '@shapediver/api.geometry-api-dto-v1'

import { TreeNodeConverter } from './TreeNodeConverter'
import { mat4 } from 'gl-matrix'

@singleton()
export class DataEngine {
    private readonly _geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
    private readonly _htmlElementAnchorEngine: HTMLElementAnchorEngine = <HTMLElementAnchorEngine>container.resolve(HTMLElementAnchorEngine);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    private readonly _tag3dEngine: Tag3dEngine = <Tag3dEngine>container.resolve(Tag3dEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    public async loadContent(content: ShapeDiverResponseOutputPart): Promise<TreeNode> {
        if(!content || (content && !content.format)) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('DataEngine.loadContent: Invalid content was provided to data engine.'));
            return new TreeNode();
        }

        try {
            const transformations: ITransformation[] = [];
            if (content.transformations && Array.isArray(content.transformations)) {
                for(let i = 0; i < content.transformations.length; i++) {
                    const t = content.transformations[i];
                    if(Array.isArray(t) && t.length === 16)
                        transformations.push({
                            id: 'content_' + i,
                            matrix: mat4.fromValues(t[0], t[1], t[2], t[3], 
                                                    t[4], t[5], t[6], t[7], 
                                                    t[8], t[9], t[10], t[11], 
                                                    t[12], t[13], t[14], t[15]),
                            name: 'content_' + i,
                        })
                }
            } 

            if (content.format === 'glb' || content.format === 'gltf') {
                const node = await this._geometryEngine.loadContent(content);
                node.transformations.push(...transformations);
                return node;
            } else if (content.format === 'material') {
                const node = await this._materialEngine.loadContent(content);
                node.transformations.push(...transformations);
                return node;
            } else if (content.format === 'tag2d' || content.format === 'anchor') {
                const node = await this._htmlElementAnchorEngine.loadContent(content);
                node.transformations.push(...transformations);
                return node;
            } else if (content.format === 'tag3d') {
                const node = await this._tag3dEngine.loadContent(content);
                node.transformations.push(...transformations);
                return node;
            } else if (content.format === 'sdtf') {
                const sdtfFile = await new Reader().readFromUri(content.href!);
                if(!sdtfFile) return new TreeNode();
                const node = new TreeNodeConverter().convertToTreeNode(sdtfFile);
                node.transformations.push(...transformations);
                return node;
            } else {
                const customNode = new TreeNode('custom');
                customNode.data.push(new CustomData({ ...content }));
                customNode.transformations.push(...transformations);
                return customNode;
            }
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, e, `DataEngine.loadContent: An error occurred while loading the ${content.format}. ${e.message}`, e.response.status, false)
              } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, e, `DataEngine.loadContent: An error occurred while loading the ${content.format}. ${e.message}`, false)
            }
            return new TreeNode();
        }
    }
}