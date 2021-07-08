import { container, singleton } from 'tsyringe';
import { CustomData } from '@shapediver/viewer.shared.types';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine';
import { Tag3dEngine } from '@shapediver/viewer.data-engine.tag3d-engine';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { Reader } from '@shapediver/viewer.sdtf.converter';
import { TreeNodeConverter } from './TreeNodeConverter';
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils';
import { HTMLElementAnchorEngine } from '@shapediver/viewer.data-engine.html-element-anchor-engine';
import { ShapeDiverResponseOutputPart } from "@shapediver/api.geometry-api-dto-v1";

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
            if (content.format === 'glb' || content.format === 'gltf') {
                return await this._geometryEngine.loadContent(content);
            } else if (content.format === 'material') {
                return await this._materialEngine.loadContent(content);
            } else if (content.format === 'tag2d' || content.format === 'anchor') {
                return await this._htmlElementAnchorEngine.loadContent(content);
            } else if (content.format === 'tag3d') {
                return await this._tag3dEngine.loadContent(content);
            } else if (content.format === 'sdtf') {
                const sdtfFile = await new Reader().readFromUri(content.href!);
                if(!sdtfFile) return new TreeNode();
                return new TreeNodeConverter().convertToTreeNode(sdtfFile);
            } else {
                const customNode = new TreeNode('custom');
                customNode.data.push(new CustomData({ ...content }));
                return customNode;
            }
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `DataEngine.loadContent: An error occurred while loading the ${content.format}. ${e.message}`, e.response.status, false)
              } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `DataEngine.loadContent: An error occurred while loading the ${content.format}. ${e.message}`, false)
            }
            return new TreeNode();
        }
    }
}