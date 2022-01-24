import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { HttpClient, Logger, LOGGINGTOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { ISDTF } from '@shapediver/viewer.data-engine.shared-types'
import { GEOMETRYTYPEHINT, PRIMITIVETYPEHINT, SDTFAttributeData, SDTFAttributeOverview, SDTFAttributesData, SDTFItemData } from '@shapediver/viewer.shared.types'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

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
    public async loadContent(content: ShapeDiverResponseOutputContent, loadData: (img: string) => Promise<Blob | HTMLImageElement>): Promise<TreeNode> {
        const node = new TreeNode('sdtf');

        if (!content || (content && !content.href)) {
            const error = new ShapeDiverViewerDataProcessingError('SDTFEngine.loadContent: Invalid content was provided to geometry engine.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
        }

        let axiosResponse;
        try {
            axiosResponse = await this._httpClient.get(content.href!, {
                responseType: 'arraybuffer'
            });
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, e);
        }

        if (!(axiosResponse.headers['content-type'] && axiosResponse.headers['content-type'] === 'model/vnd.sdtf')) {
            const error = new ShapeDiverViewerDataProcessingError('SDTFEngine.loadContent: Non-binary SDTF encoding not implemented.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
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
            const error = new ShapeDiverViewerDataProcessingError('SDTFEngine.loadContent: Invalid data: sdtf magic wrong.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
        } 
        const version = headerDataView.getUint32(4, true);
        if (version !== 1) {
            const error = new ShapeDiverViewerDataProcessingError(`SDTFEngine.loadContent: Invalid version: sdtf loader does not support version ${version}.`);
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
        } 
        const totalLength = headerDataView.getUint32(8, true);
        const contentLength = headerDataView.getUint32(12, true);
        const contentFormat = headerDataView.getUint32(16, true);
        if (contentFormat !== 0) {
            const error = new ShapeDiverViewerDataProcessingError(`SDTFEngine.loadContent: Content format is not Json (0), content invalid.`);
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
        }

        this._content = <ISDTF>JSON.parse(new TextDecoder().decode(new DataView(arrayBuffer, this.BINARY_EXTENSION_HEADER_LENGTH, contentLength)));
        this._body = arrayBuffer.slice(this.BINARY_EXTENSION_HEADER_LENGTH + contentLength, totalLength);

        // look through attributes

        try {
            const overview: {
                [key: string]: {
                    typeHint: PRIMITIVETYPEHINT | GEOMETRYTYPEHINT | string;
                    count: number;
                    values?: string[];
                    min?: number;
                    max?: number;
                }[];
            } = {};

            for (let i = 0; i < this._content.attributes.length; i++) {
                const attributes = this._content.attributes[i];
                for (let key in attributes) {
                    const dataToCopy = attributes[key];
                    const dataTypehint = this._content.typeHints[dataToCopy.typeHint].name;

                    const existingEntries = overview[key] ? overview[key].filter(o => o.typeHint === dataTypehint) : [];
                    if (overview[key] && existingEntries.length > 0) {
                        const entry = existingEntries[0];
                        entry.count++;
                        if (dataTypehint === PRIMITIVETYPEHINT.STRING) {
                            if (!entry.values?.includes(dataToCopy.value))
                                entry.values?.push(dataToCopy.value)
                        }
                        if (dataTypehint === PRIMITIVETYPEHINT.DOUBLE ||
                            dataTypehint === PRIMITIVETYPEHINT.FLOAT ||
                            dataTypehint === PRIMITIVETYPEHINT.DECIMAL ||
                            dataTypehint === PRIMITIVETYPEHINT.INT) {
                            entry.min = Math.min(<number>dataToCopy.value, entry.min!);
                            entry.max = Math.max(<number>dataToCopy.value, entry.max!);
                        }
                    } else {
                        if (overview[key]) {
                            overview[key].push({
                                typeHint: dataTypehint,
                                count: 1,
                            })
                        } else {
                            overview[key] = [{
                                typeHint: dataTypehint,
                                count: 1,
                            }]
                        }
                        if (dataTypehint === PRIMITIVETYPEHINT.STRING) {
                            overview[key][overview[key].length - 1].values = [dataToCopy.value];
                        }
                        if (dataTypehint === PRIMITIVETYPEHINT.DOUBLE ||
                            dataTypehint === PRIMITIVETYPEHINT.FLOAT ||
                            dataTypehint === PRIMITIVETYPEHINT.DECIMAL ||
                            dataTypehint === PRIMITIVETYPEHINT.INT) {
                            overview[key][overview[key].length - 1].min = <number>dataToCopy.value;
                            overview[key][overview[key].length - 1].max = <number>dataToCopy.value;
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
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.load`, e);
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (4)

    private loadAttributes(attributesID: number): SDTFAttributesData {
        if (!this._content.attributes) throw new Error('Attributes not available.')
        if (!this._content.attributes[attributesID]) throw new Error('Attributes not available.')
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

    private async loadChunk(chunkId: number): Promise<TreeNode> {
        if (!this._content.chunks) throw new Error('Chunks not available.')
        if (!this._content.chunks[chunkId]) throw new Error('Chunks not available.')
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

    private async loadItem(itemId: number, index: number): Promise<TreeNode> {
        if (!this._content.items) throw new Error('Item not available.')
        if (!this._content.items[itemId]) throw new Error('Item not available.')
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
        if (!this._content.nodes) throw new Error('Node not available.')
        if (!this._content.nodes[nodeId]) throw new Error('Node not available.')
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

    // #endregion Private Methods (4)
}