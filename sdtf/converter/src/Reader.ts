import { JsonSdtf, SdtfFile } from '@shapediver/viewer.sdtf.shared'
import { Encoder } from '@shapediver/viewer.sdtf.parser'

import { SdtfFactory } from './SdtfFactory'

export class Reader {

    /**
     * Reading from uri to sdtf file
     * 
     * @param uri the uri to read
     * @returns a promise for the sdtf file
     */
    public async readFromUri(uri: string): Promise<SdtfFile  | null> {
        if(!uri) return null;
        const arrayBuffer = await new Encoder().encodeFromUriToArrayBuffer(uri);
        if(!arrayBuffer) return null;
        return this.readFromArrayBuffer(arrayBuffer);
    }

    /**
     * Reading from array buffer to sdtf file
     * 
     * @param arrayBuffer the array buffer to read
     * @returns a promise for the sdtf file
     */
    public async readFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<SdtfFile | null> {
        if(!arrayBuffer) return null;
        const json = await new Encoder().encodeFromArrayBufferToJson(arrayBuffer);
        if(!json) return null;
        return this.readFromJson(json.json, json.binaryData);
    }

    /**
     * Reading from json representation to sdtf file
     * 
     * @param json the json to read
     * @param binaryData the optional binary data
     * @returns a promise for the sdtf file
     */
    public async readFromJson(json: JsonSdtf, binaryData?: ArrayBuffer): Promise<SdtfFile | null> {
        if(!json) return null;
        return new SdtfFactory().create(json, binaryData);
    }
}