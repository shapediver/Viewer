import { container, singleton } from 'tsyringe'
import { CustomData } from '@shapediver/viewer.shared.types'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine'
import { SDTFEngine } from '@shapediver/viewer.data-engine.sdtf-engine'
import { Tag3dEngine } from '@shapediver/viewer.data-engine.tag3d-engine'
import { ITransformation, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { HttpClient, Logger, LOGGINGTOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { HTMLElementAnchorEngine } from '@shapediver/viewer.data-engine.html-element-anchor-engine'

import { mat4 } from 'gl-matrix'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

@singleton()
export class DataEngine {
    // #region Properties (6)

    private readonly _geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
    private readonly _htmlElementAnchorEngine: HTMLElementAnchorEngine = <HTMLElementAnchorEngine>container.resolve(HTMLElementAnchorEngine);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    private readonly _sdtfEngine: SDTFEngine = <SDTFEngine>container.resolve(SDTFEngine);
    private readonly _tag3dEngine: Tag3dEngine = <Tag3dEngine>container.resolve(Tag3dEngine);
    private _loadData: (img: string) => Promise<Blob | HTMLImageElement> = this._httpClient.loadData.bind(this._httpClient);

    // #endregion Properties (6)

    // #region Public Methods (1)

    public async loadContent(content: ShapeDiverResponseOutputContent, loadData?: (img: string) => Promise<Blob | HTMLImageElement>): Promise<TreeNode> {
        if(loadData) {
            this._loadData = loadData;
        } else {
            this._loadData = this._httpClient.loadData.bind(this._httpClient);
        }

        if(!content || (content && !content.format)) {
            const error = new ShapeDiverViewerDataProcessingError('DataEngine cannot load content.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `DataEngine.loadContent`, error);
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
                                                    t[12], t[13], t[14], t[15])
                        })
                }
            } 

            if (content.format === 'glb' || content.format === 'gltf') {
                const node = await this._geometryEngine.loadContent(content, this._loadData);
                node.transformations = transformations.concat(node.transformations);
                return node;
            } else if (content.format === 'material') {
                const node = await this._materialEngine.loadContent(content, this._loadData);
                node.transformations = transformations.concat(node.transformations);
                return node;
            } else if (content.format === 'tag2d' || content.format === 'anchor') {
                const node = await this._htmlElementAnchorEngine.loadContent(content, this._loadData);
                node.transformations = transformations.concat(node.transformations);
                return node;
            } else if (content.format === 'tag3d') {
                const node = await this._tag3dEngine.loadContent(content, this._loadData);
                node.transformations = transformations.concat(node.transformations);
                return node;
            } else if (content.format === 'sdtf') {
                const node = await this._sdtfEngine.loadContent(content, this._loadData);
                node.transformations = transformations.concat(node.transformations);
                return node;
            } else {
                const customNode = new TreeNode('custom');
                customNode.data.push(new CustomData({ ...content }));
                customNode.transformations = transformations.concat(customNode.transformations);
                return customNode;
            }
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `DataEngine.loadContent`, e);
        }
    }

    // #endregion Public Methods (1)
}