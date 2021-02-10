import { SdtfFile, SdtfTypeHint, SdtfBuffer, SdtfBufferView, SdtfAccessor, SdtfAttributes, SdtfData, SdtfNode, SdtfChunk, SdtfDataFactory } from "@shapediver/viewer.sdtf.shared";
import { PRIMITIVETYPEHINT, GEOMETRYTYPEHINT, RHINOTYPEHINT, CONTENTTYPE, CONTENT_ENCODING } from "@shapediver/viewer.sdtf.shared";
import { JsonSdtf } from "@shapediver/viewer.sdtf.shared";
import { JsonAttribute } from "@shapediver/viewer.sdtf.shared";

export class SdtfFactory {

    /**
     * Create an sdtf file from a json representation and an optional binary data buffer.
     * All properties of the json get translated into their own classes to add functionality.
     * 
     * @param json 
     * @param binaryData 
     */
    public create(json: JsonSdtf, binaryData?: ArrayBuffer): SdtfFile {
        const typeHints: SdtfTypeHint[] = this.createTypeHints(json);
        const buffers: SdtfBuffer[] = this.createBuffers(json, binaryData!);
        const bufferViews: SdtfBufferView[] = this.createBufferViews(json, buffers);
        const accessors: SdtfAccessor[] = this.createAccessors(json, bufferViews);
        const attributes: SdtfAttributes[] = this.createAttributes(json, accessors, typeHints);
        const items: SdtfData<any>[] = this.createItems(json, typeHints, accessors, attributes);
        const nodes: SdtfNode[] = this.createNodes(json, items, typeHints, attributes);
        const chunks: SdtfChunk[] = this.createChunks(json, items, typeHints, attributes, nodes);

        return new SdtfFile(chunks, typeHints);
    }

    // #region Private Methods (1)

    /**
     * Create an array of typehint classes
     * 
     * @param json the json specification
     * @returns an array of typehint classes
     */
    private createTypeHints(json: JsonSdtf): SdtfTypeHint[] {
        const array: SdtfTypeHint[] = [];
        for (let i = 0; i < json.typeHints.length; i++) {
            array.push(new SdtfTypeHint(json.typeHints[i].name as (PRIMITIVETYPEHINT | GEOMETRYTYPEHINT | RHINOTYPEHINT)));
        }
        return array;
    }

    /**
     * Create an array of buffer classes
     * 
     * @param json the json specification
     * @param binaryData optional binary data
     * @returns an array of buffer classes
     */
    private createBuffers(json: JsonSdtf, binaryData?: ArrayBuffer): SdtfBuffer[] {
        const array: SdtfBuffer[] = [];
        for (let i = 0; i < json.buffers.length; i++) {
            array.push(
                new SdtfBuffer(
                    json.buffers[i].byteLength,
                    json.buffers[i].uri,
                    binaryData
                )
            );
        }
        return array;
    }

    /**
     * Create an array of buffer view classes
     * 
     * @param json the json specification
     * @param buffers all available buffers that might be needed
     * @returns an array of buffer view classes
     */
    private createBufferViews(json: JsonSdtf, buffers: SdtfBuffer[]): SdtfBufferView[] {
        const array: SdtfBufferView[] = [];
        for (let i = 0; i < json.bufferViews.length; i++) {
            array.push(
                new SdtfBufferView(
                    buffers[json.bufferViews[i].buffer],
                    json.bufferViews[i].byteLength,
                    json.bufferViews[i].byteOffset,
                    json.bufferViews[i].contentType as CONTENTTYPE,
                    json.bufferViews[i].contentEncoding as CONTENT_ENCODING,
                    json.bufferViews[i].name
                )
            );
        }
        return array;
    }

    /**
     * Create an array of accessor classes
     * 
     * @param json the json specification
     * @param bufferViews all available buffer views that might be needed
     * @returns an array of accessor classes
     */
    private createAccessors(json: JsonSdtf, bufferViews: SdtfBufferView[]): SdtfAccessor[] {
        const array: SdtfAccessor[] = [];
        for (let i = 0; i < json.accessors.length; i++) {
            array.push(
                new SdtfAccessor(
                    bufferViews[json.accessors[i].bufferView],
                    json.accessors[i].id
                )
            );
        }
        return array;
    }

    /**
     * Create an array of attribute classes
     * 
     * @param json the json specification
     * @param accessors all available accessors that might be needed
     * @param typeHints all available typeHints that might be needed
     * @returns an array of attributes classes
     */
    private createAttributes(json: JsonSdtf, accessors: SdtfAccessor[], typeHints: SdtfTypeHint[]): SdtfAttributes[] {
        const array: SdtfAttributes[] = [];
        for (let i = 0; i < json.attributes.length; i++) {
            const jsonAttribute: JsonAttribute = json.attributes[i];
            const converted: { [key: string]: SdtfData<any>} = {};
            const dataFactory = new SdtfDataFactory();
            for(let key in jsonAttribute) {
                converted[key] = dataFactory.createAttribute(
                    typeHints[jsonAttribute[key].typeHint],
                    jsonAttribute[key].accessor !== undefined ? accessors[jsonAttribute[key].accessor!] : undefined,
                    jsonAttribute[key].value,
                );
            }
            array.push(new SdtfAttributes(converted));
        }
        return array;
    }

    /**
     * Create an array of item classes
     * 
     * @param json the json specification
     * @param typeHints all available typeHints that might be needed
     * @param accessors all available accessors that might be needed
     * @param attributes all available attributes that might be needed
     * @returns an array of item classes
     */
    private createItems(json: JsonSdtf, typeHints: SdtfTypeHint[], accessors: SdtfAccessor[], attributes: SdtfAttributes[]): SdtfData<any>[] {
        const array: SdtfData<any>[] = [];
        const dataFactory = new SdtfDataFactory();
        for (let i = 0; i < json.items.length; i++) {
            array.push(
                dataFactory.createItem(
                    typeHints[json.items[i].typeHint],
                    json.items[i].accessor !== undefined ? accessors[json.items[i].accessor!] : undefined,
                    json.items[i].value,
                    json.items[i].attributes !== undefined ? attributes[json.items[i].attributes!] : undefined,
                )
            )
        }
        return array;
    }

    /**
     * Create an array of node classes
     * 
     * @param json the json specification
     * @param items all available items that might be needed
     * @param typeHints all available typeHints that might be needed
     * @param attributes all available attributes that might be needed
     * @returns an array of node classes
     */
    private createNodes(json: JsonSdtf, items: SdtfData<any>[], typeHints: SdtfTypeHint[], attributes: SdtfAttributes[]): SdtfNode[] {
        const array: SdtfNode[] = [];
        for (let i = 0; i < json.nodes.length; i++) {
            
            // gather all items
            const itemArray: SdtfData<any>[] = [];
            if (json.nodes[i].items !== undefined)
                for (let j = 0; j < json.nodes[i].items.length; j++)
                    itemArray.push(items[json.nodes[i].items[j]]);

            array.push(
                new SdtfNode(
                    itemArray,
                    [],
                    json.nodes[i].attributes !== undefined ? attributes[json.nodes[i].attributes!] : undefined,
                    json.nodes[i].name,
                    json.nodes[i].typeHint !== undefined ? typeHints[json.nodes[i].typeHint!] : undefined
                )
            )
        }

        // second loop to assign the child nodes
        // in the first pass, all nodes are created without children
        // here the children are evaluated and assigned
        for (let i = 0; i < json.nodes.length; i++) {
            const nodeArray: SdtfNode[] = [];
            if (json.nodes[i].nodes !== undefined)
                for (let j = 0; j < json.nodes[i].nodes!.length; j++)
                    nodeArray.push(array[json.nodes[i].nodes![j]])

            array[i].nodes = nodeArray;
        }
        return array;
    }

    /**
     * Create an array of chunk classes
     * 
     * @param json the json specification
     * @param items all available items that might be needed
     * @param typeHints all available typeHints that might be needed
     * @param attributes all available attributes that might be needed
     * @param nodes all available nodes that might be needed
     * @returns an array of chunk classes
     */
    private createChunks(json: JsonSdtf, items: SdtfData<any>[], typeHints: SdtfTypeHint[], attributes: SdtfAttributes[], nodes: SdtfNode[]): SdtfChunk[] {
        const array: SdtfChunk[] = [];
        for (let i = 0; i < json.chunks.length; i++) {

            // gather all items
            const itemArray: SdtfData<any>[] = [];
            if (json.chunks[i].items !== undefined)
                for (let j = 0; j < json.chunks[i].items.length; j++)
                    itemArray.push(items[json.chunks[i].items[j]]);

            // gather all nodes
            const nodeArray: SdtfNode[] = [];
            if (json.chunks[i].nodes !== undefined)
                for (let j = 0; j < json.chunks[i].nodes!.length; j++)
                    nodeArray.push(nodes[json.chunks[i].nodes![j]])

            array.push(
                new SdtfChunk(
                    itemArray,
                    nodeArray,
                    json.chunks[i].attributes !== undefined ? attributes[json.chunks[i].attributes!] : undefined,
                    json.chunks[i].name,
                    json.chunks[i].typeHint !== undefined ? typeHints[json.chunks[i].typeHint!] : undefined
                )
            )
        }
        return array;
    }
    // #endregion Private Methods (1)
}
