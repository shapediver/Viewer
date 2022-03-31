import { create, ISdDtfAsset, ISdDtfAttributes, ISdDtfChunk, ISdDtfDataItem, ISdDtfNode } from '@shapediver/sdk.sdtf-v1'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { Logger, LOGGINGTOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import {
  GEOMETRYTYPEHINT,
  PRIMITIVETYPEHINT,
  SDTFAttributeData,
  SDTFAttributeOverview,
  SDTFAttributesData,
  SDTFItemData,
} from '@shapediver/viewer.shared.types'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

@singleton()
export class SDTFEngine {
    // #region Properties (2)

    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    private _parsedFile!: ISdDtfAsset;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Load the sdtf content into a scene graph node.
     * 
     * @param content the geometry content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<TreeNode> {
        const node = new TreeNode('sdtf');

        // We have to be safe and check if the content is a valid SDTF file
        if (!content || (content && !content.href)) {
            const error = new ShapeDiverViewerDataProcessingError('SDTFEngine.loadContent: Invalid content was provided to geometry engine.');
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.loadContent`, error);
        }

        // create the sdtf sdk
        const sdk = create();
        // crete the sdtf parser
        const parser = sdk.createParser();
        // parse the file
        this._parsedFile = await parser.readFromUrl(content.href!);

        try {
            // crete the overview and save it in the node data
            node.data.push(this.createSDTFOverview());

            // add the loaded chunks to the node
            for (let i = 0; i < this._parsedFile.chunks.length; i++) 
                node.children.push(this.loadChunk(this._parsedFile.chunks[i], i));
                
            return node;
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `SDTFEngine.load`, e);
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (5)

    /**
     * Create an overview of the SDTF file.
     * This overview is used for the data visualization.
     * It is structured as a dictionary with the name as the key and an array of Objects as the value.
     * The array of objects contains the different types that can be found in the SDTF file under the same name.
     * 
     * Example:
     * {
     *     "color": [
     *         {
     *             typeHint: PRIMITIVETYPEHINT.STRING,
     *             count: 2,
     *             values: ["red", "blue"]
     *         },
     *         {
     *             typeHint: 'numberArray',
     *             count: 2,
     *             values: [[1,0,0,1], [0,0,1,1]]
     *         },
     *     ]
     * }
     * 
     * The overview contains the following information:
     * - name of the attribute + type of the attribute
     * - the count 
     * - for numerical attributes, the min and max values
     * - for string attributes, the unique values
     * 
     * @returns 
     */
    private createSDTFOverview(): SDTFAttributeOverview {
        const overview: {
            [key: string]: {
                typeHint: PRIMITIVETYPEHINT | GEOMETRYTYPEHINT | string;
                count: number;
                values?: string[];
                min?: number;
                max?: number;
            }[];
        } = {};

        // go through all attributes
        for (let i = 0; i < this._parsedFile.attributes.length; i++) {
            const attributes = this._parsedFile.attributes[i];

            // go through all entries
            for (let key in attributes.entries) {
                const dataToCopy = attributes.entries[key];

                // create the type hint to use
                const dataTypehint = dataToCopy.typeHint === undefined ? 'undefined' : dataToCopy.typeHint.name;

                // check if the attribute is already in the overview
                const existingEntries = overview[key] ? overview[key].filter(o => o.typeHint === dataTypehint) : [];

                if (overview[key] && existingEntries.length > 0) {
                    // update the existing entry
                    const entry = existingEntries[0];
                    // update the count
                    entry.count++;

                    // update the values
                    if (dataTypehint === PRIMITIVETYPEHINT.STRING) {
                        if (!entry.values?.includes(<string>dataToCopy.value))
                            entry.values?.push(<string>dataToCopy.value)
                    }
                    
                    // update the min and max
                    if (dataTypehint === PRIMITIVETYPEHINT.DOUBLE ||
                        dataTypehint === PRIMITIVETYPEHINT.FLOAT ||
                        dataTypehint === PRIMITIVETYPEHINT.DECIMAL ||
                        dataTypehint === PRIMITIVETYPEHINT.INT) {  
                        entry.min = Math.min(<number>dataToCopy.value, entry.min!);
                        entry.max = Math.max(<number>dataToCopy.value, entry.max!);
                    }
                } else {
                    // create a new entry, if the name already exists, but the type does not
                    if (overview[key]) {
                        overview[key].push({
                            typeHint: dataTypehint,
                            count: 1,
                        })
                    } 
                    // create completely new entry
                    else {
                        overview[key] = [{
                            typeHint: dataTypehint,
                            count: 1,
                        }]
                    }

                    // update the values
                    if (dataTypehint === PRIMITIVETYPEHINT.STRING) {
                        overview[key][overview[key].length - 1].values = [<string>dataToCopy.value];
                    }
                                        
                    // update the min and max
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
        return new SDTFAttributeOverview(overview);
    }

    /**
     * Load the attributes into a SDTFAttributesData data item.
     * 
     * @param attributes 
     * @returns 
     */
    private loadAttributes(attributes: ISdDtfAttributes): SDTFAttributesData {
        const data = new SDTFAttributesData();
        // go through all attributes entries and save them in data items
        for (let key in attributes.entries) {
            if (attributes.entries[key].value === undefined) {
                // TODO async data
            } 
            // case of primitive data
            else {
                // create the data item and save it in the dictionary
                const typeHint = attributes.entries[key].typeHint === undefined ? 'undefined' : attributes.entries[key].typeHint!.name;
                data.attributes[key] = new SDTFAttributeData(typeHint, attributes.entries[key].value);
            }
        }
        return data;
    }

    /**
     * Load the chunk into a scene graph node.
     * 
     * @param chunk 
     * @param chunkId 
     * @returns 
     */
    private loadChunk(chunk: ISdDtfChunk, chunkId: number): TreeNode {
        const chunkDef = new TreeNode(chunk.name || 'chunk_' + chunkId);

        // if there are attributes, add them to the chunk as data
        if (chunk.attributes !== undefined) {
            chunkDef.data.push(this.loadAttributes(chunk.attributes));
        }

        // if there are items, add them to the chunk as children
        if (chunk.items !== undefined && chunk.items.length > 0) {
            for (let i = 0, len = chunk.items.length; i < len; i++) {
                // got through all items
                chunkDef.addChild(this.loadItem(chunk.items[i], i));
            }
        }

        // if there are nodes, add them to the chunk as children
        if (chunk.nodes !== undefined && chunk.nodes.length > 0) {
            for (let i = 0, len = chunk.nodes.length; i < len; i++) {
                // got through all children
                chunkDef.addChild(this.loadNode(chunk.nodes[i], i));
            }
        }

        return chunkDef;
    }

    /**
     * Load the item into a scene graph node.
     * 
     * @param item 
     * @param itemId 
     * @returns 
     */
    private loadItem(item: ISdDtfDataItem, itemId: number): TreeNode {
        const itemDef = new TreeNode(itemId + '');

        // if there are attributes, add them to the item
        let attributes;
        if (item.attributes !== undefined)
            attributes = this.loadAttributes(item.attributes);

        // create the typehint
        const typeHint = item.typeHint === undefined ? 'undefined' : item.typeHint!.name;

        // create the data and save it in the item node
        const itemData = new SDTFItemData(typeHint, item.value, attributes?.attributes!)
        itemDef.data.push(itemData)

        return itemDef;
    }

    /**
     * Load the node into a scene graph node.
     * 
     * @param node 
     * @param nodeId 
     * @returns 
     */
    private loadNode(node: ISdDtfNode, nodeId: number): TreeNode {
        const nodeDef = new TreeNode(node.name || 'node_' + nodeId);

        // if there are attributes, add them to the node as data
        if (node.attributes !== undefined) {
            nodeDef.data.push(this.loadAttributes(node.attributes));
        }

        // if there are items, add them to the node as children
        if (node.items !== undefined && node.items.length > 0) {
            for (let i = 0, len = node.items.length; i < len; i++) {
                // got through all items
                nodeDef.addChild(this.loadItem(node.items[i], i));
            }
        }

        // if there are nodes, add them to the node as children
        if (node.nodes !== undefined && node.nodes.length > 0) {
            for (let i = 0, len = node.nodes.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(this.loadNode(node.nodes[i], i));
            }
        }

        return nodeDef;
    }

    // #endregion Private Methods (5)
}