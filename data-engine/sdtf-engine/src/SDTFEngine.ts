import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { HttpClient, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { ShapeDiverResponseOutputPart } from '@shapediver/api.geometry-api-dto-v1'
import { ISDTF } from '@shapediver/viewer.data-engine.shared-types'
import { SDTFAttributeData, SDTFAttributeOverview, SDTFAttributesData, SDTFItemData } from '@shapediver/viewer.shared.types'

@singleton()
export class SDTFEngine {
    // #region Properties (5)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    private _body!: ArrayBuffer;
    private _content!: ISDTF;

    // #endregion Properties (5)

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
    public async loadContent(content: ShapeDiverResponseOutputPart): Promise<TreeNode> {
        const node = new TreeNode('sdtf');

        if (!content || (content && !content.href)) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('SDTFEngine.loadContent: Invalid content was provided to geometry engine.'), '', false);
            return node;
        }

        let axiosResponse;
        try {
            axiosResponse = await this._httpClient.get(content.href!, {
                responseType: 'arraybuffer'
            });
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.SDTF, e, `SDTFEngine.loadContent: Was not able to get array buffer from uri.`, e.response.status, false)
              } else {
                this._logger.error(LOGGINGTOPIC.SDTF, e, `SDTFEngine.loadContent: Was not able to get array buffer from uri.`, false)
            }
            return node;
        }

        if (!(axiosResponse.headers['content-type'] && axiosResponse.headers['content-type'] === 'model/vnd.sdtf')) {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('SDTFEngine.loadContent: Non-binary SDTF encoding not implemented.'));
            return node;
        }

        let arrayBuffer: ArrayBuffer;
        if (axiosResponse.data instanceof ArrayBuffer) {
            arrayBuffer = axiosResponse.data;
        } else {
            arrayBuffer = (<Uint8Array>axiosResponse.data).buffer
        }

        const headerDataView = new DataView(arrayBuffer, 0, this.BINARY_EXTENSION_HEADER_LENGTH);

        const magic = String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3));
        if (magic !== 'sdtf') {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('SDTFEngine.loadContent: Invalid data: sdtf magic wrong.'));
            return node;
        } 
        const version = headerDataView.getUint32(4, true);
        if (version !== 1) {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError(`SDTFEngine.loadContent: Invalid version: sdtf loader does not support version ${version}.`));
            return node;
        } 
        const totalLength = headerDataView.getUint32(8, true);
        const contentLength = headerDataView.getUint32(12, true);
        const contentFormat = headerDataView.getUint32(16, true);
        if (contentFormat !== 0) {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('SDTFEngine.loadContent: Content format is not Json (0), content invalid.'));
            return node;
        }

        this._content = <ISDTF>JSON.parse(new TextDecoder().decode(new DataView(arrayBuffer, this.BINARY_EXTENSION_HEADER_LENGTH, contentLength)));
        this._body = arrayBuffer.slice(this.BINARY_EXTENSION_HEADER_LENGTH + contentLength, totalLength);

        // look through attributes
        
        try {
            const overview: {
                [key: string]: {
                    typeHint: string;
                    count: number;
                    values?: string[];
                    min?: number;
                    max?: number;
                };
            } = {};

            for(let i = 0; i < this._content.attributes.length; i++) {
                const a = this._content.attributes[i];
                for(let k in a) {
                    const overviewKey = k + '_' + this._content.typeHints[a[k].typeHint].name;
                    if (overview[overviewKey]) {
                        overview[overviewKey].count++;
                        if (this._content.typeHints[a[k].typeHint].name === 'string') {
                            if (!overview[overviewKey].values?.includes(a[k].value))
                                overview[overviewKey].values?.push(a[k].value)
                        }
                        if (this._content.typeHints[a[k].typeHint].name === 'double' ||
                            this._content.typeHints[a[k].typeHint].name === 'float' ||
                            this._content.typeHints[a[k].typeHint].name === 'decimal' ||
                            this._content.typeHints[a[k].typeHint].name === 'int') {
                            overview[overviewKey].min = Math.min(<number>a[k].value, overview[overviewKey].min!);
                            overview[overviewKey].max = Math.max(<number>a[k].value, overview[overviewKey].max!);
                        }
                    } else {
                        overview[overviewKey] = {
                            typeHint: this._content.typeHints[a[k].typeHint].name,
                            count: 1
                        }
                        if(this._content.typeHints[a[k].typeHint].name === 'string') {
                            overview[overviewKey].values = [a[k].value];
                        }
                        if (this._content.typeHints[a[k].typeHint].name === 'double' ||
                            this._content.typeHints[a[k].typeHint].name === 'float' ||
                            this._content.typeHints[a[k].typeHint].name === 'decimal' ||
                            this._content.typeHints[a[k].typeHint].name === 'int') {
                            overview[overviewKey].min = <number>a[k].value;
                            overview[overviewKey].max = <number>a[k].value;
                        }
                    }
                }
            }
            node.data.push(new SDTFAttributeOverview(overview));

            for(let i = 0; i < this._content.chunks.length; i++) {
                node.children.push(await this.loadChunk(i));
            }
            return node;
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, e, `SDTFEngine.load: Loading of sdtf failed. ${e.message}`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, e, `SDTFEngine.load: Loading of sdtf failed. ${e.message}`, false)
            }
            return new TreeNode('sdtf');
        }
    }

    private loadAttributes(attributesID: number): SDTFAttributesData {
        if (!this._content.attributes) throw new SDError('Attributes not available.')
        if (!this._content.attributes[attributesID]) throw new SDError('Attributes not available.')
        const attributes = this._content.attributes[attributesID];
        const data = new SDTFAttributesData();
        for(let key in attributes) {
            if(attributes[key].value === undefined) {
                // TODO async data
            } else {
                data.attributes[key] = new SDTFAttributeData(
                    this._content.typeHints[attributes[key].typeHint].name,
                    attributes[key].value
                );
            }
        }
        return data;
    }

    private async loadItem(itemId: number, index: number): Promise<TreeNode> {
        if (!this._content.items) throw new SDError('Item not available.')
        if (!this._content.items[itemId]) throw new SDError('Item not available.')
        const item = this._content.items[itemId];
        const itemDef = new TreeNode(index + '');

        let attributes;
        if (item.attributes !== undefined) 
                attributes = this.loadAttributes(item.attributes);
        const itemData = new SDTFItemData(this._content.typeHints[item.typeHint].name, item.value, attributes?.attributes!)
        itemDef.data.push(itemData)

        return itemDef;
    }


    private async loadNode(nodeId: number): Promise<TreeNode> {
        if (!this._content.nodes) throw new SDError('Node not available.')
        if (!this._content.nodes[nodeId]) throw new SDError('Node not available.')
        const node = this._content.nodes[nodeId];
        const nodeDef = new TreeNode(node.name || 'node_' + nodeId);

        if(node.attributes !== undefined) {
            nodeDef.data.push(this.loadAttributes(node.attributes));
        }
        if(node.items !== undefined && node.items.length > 0) {
            for (let i = 0, len = node.items.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadItem(node.items[i], i));
            }
        }

        if (node.nodes !== undefined && node.nodes.length > 0) {
            for (let i = 0, len = node.nodes.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.nodes[i]));
            }
        }

        return nodeDef;
    }

    private async loadChunk(chunkId: number): Promise<TreeNode> {
        if (!this._content.chunks) throw new SDError('Chunks not available.')
        if (!this._content.chunks[chunkId]) throw new SDError('Chunks not available.')
        const chunk = this._content.chunks[chunkId];
        const chunkDef = new TreeNode(chunk.name || 'chunk_' + chunkId);

        if(chunk.attributes !== undefined) {
            chunkDef.data.push(this.loadAttributes(chunk.attributes));
        }
        if(chunk.items !== undefined && chunk.items.length > 0) {
            for (let i = 0, len = chunk.items.length; i < len; i++) {
                // got through all children
                chunkDef.addChild(await this.loadItem(chunk.items[i], i));
            }
        }

        if (chunk.nodes !== undefined && chunk.nodes.length > 0) {
            for (let i = 0, len = chunk.nodes.length; i < len; i++) {
                // got through all children
                chunkDef.addChild(await this.loadNode(chunk.nodes[i]));
            }
        }

        return chunkDef;
    }

    // #endregion Public Methods (1)
}