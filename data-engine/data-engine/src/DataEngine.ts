import { container, singleton } from 'tsyringe';
import { CustomData, ISessionOutputContent } from '@shapediver/viewer.shared.types';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { Reader } from '@shapediver/viewer.sdtf.converter';
import { TreeNodeConverter } from './TreeNodeConverter';
import { Logger } from '@shapediver/viewer.shared.monitoring';

@singleton()
export class DataEngine {
    private readonly _geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    public async loadContent(content: ISessionOutputContent): Promise<TreeNode> {
        try {
            if (content.format === 'glb' || content.format === 'gltf') {
                return await this._geometryEngine.loadContent(content);
            } else if (content.format === 'material') {
                return await this._materialEngine.loadContent(content);
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
            this._logger.error(`An error occurred while loading the ${content.format}.`, e, e.response && e.response.status ? e.response.status : null);
            return new TreeNode();
        }
    }
}