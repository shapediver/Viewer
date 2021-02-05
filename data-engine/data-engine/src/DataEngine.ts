import { container, singleton } from 'tsyringe';
import { CustomData, SessionOutputContent } from '@shapediver/viewer.shared.types';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';
import { Reader, TreeNodeConverter } from '@shapediver/viewer.sdtf.converter';

@singleton()
export class DataEngine {
    private readonly _geometryEngine: GeometryEngine;
    private readonly _materialEngine: MaterialEngine;

    constructor() {
        this._geometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
        this._materialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    }

    public async loadContent(content: SessionOutputContent): Promise<TreeNode> {
        console.log('DataEngine.loadContent', content)
        if (content.format === 'glb' || content.format === 'gltf') {
            console.log('A')
            return await this._geometryEngine.loadContent(content);
        } else if (content.format === 'material') {
            console.log('B')
            return await this._materialEngine.loadContent(content);
        } else if (content.format === 'sdtf') {
            console.log('C')
            return new TreeNodeConverter().convertToTreeNode(await new Reader().readFromUri(content.href!));
        } else {
            console.log('D')
            const customNode = new TreeNode('custom');
            customNode.data.push(new CustomData({ ...content }));
            return customNode;
        }
    }
}