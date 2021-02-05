import httpClient from '@shapediver/viewer.utils.http-client'
import { JsonSdtf } from '@shapediver/viewer.sdtf.shared'
import { EncodingError } from './EncodingError';

/**
 * Encoder that can encode from uri to json with various steps.
 * 1. from uri to array buffer
 * 2. from uri to json
 * 3. from array buffer to json
 */
export class Encoder {
    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;

    /**
     * Encoding from uri to array buffer
     * 
     * @param uri the uri to encode
     * @returns a promise for the array buffer
     */
    public async encodeFromUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
        if (uri === '') throw new EncodingError('The uri is an empty string.');

        let axiosResponse;
        try {
            axiosResponse = await httpClient.get(uri, {
                responseType: 'arraybuffer'
            });
        } catch (e) {
            throw new EncodingError('Was not able to get array buffer from uri.', e);
        }

        if (axiosResponse.headers['content-type'] && axiosResponse.headers['content-type'] === 'model/vnd.sdtf') {
            if (axiosResponse.data instanceof ArrayBuffer) {
                return axiosResponse.data;
            } else {
                return (<Uint8Array>axiosResponse.data).buffer
            }
        } else {
            // TODO
            throw new EncodingError('Non-binary SDTF encoding not implemented.');
        }
    }

    /**
     * Encoding from array buffer to json and optional binary data
     * 
     * @param arrayBuffer the array buffer to encode
     * @returns a promise for the json and optional binary data
     */
    public async encodeFromArrayBufferToJson(arrayBuffer: ArrayBuffer): Promise<{
        json: JsonSdtf,
        binaryData?: ArrayBuffer
    }> {
        const headerDataView = new DataView(arrayBuffer, 0, this.BINARY_EXTENSION_HEADER_LENGTH);

        const magic = String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3));
        if (magic !== 'sdtf') throw new EncodingError('File magic does not correspond to "sdtf".');
        const version = headerDataView.getUint32(4, true);
        if (version !== 1) throw new EncodingError('The version of the sdtf is not supported.');
        const totalLength = headerDataView.getUint32(8, true);
        const contentLength = headerDataView.getUint32(12, true);
        const contentFormat = headerDataView.getUint32(16, true);
        if (contentFormat !== 0) throw new EncodingError('Content format is not Json (0), content invalid.');

        const json = <JsonSdtf>JSON.parse(new TextDecoder().decode(new DataView(arrayBuffer, this.BINARY_EXTENSION_HEADER_LENGTH, contentLength)));
        const binaryData = arrayBuffer.slice(this.BINARY_EXTENSION_HEADER_LENGTH + contentLength, totalLength);

        return {
            json, binaryData
        }
    }

    /**
     * Encoding from uri to json and optional binary data
     * 
     * @param uri the uri to encode
     * @returns a promise for the json and optional binary data
     */
    public async encodeFromUriToJson(uri: string): Promise<{
        json: JsonSdtf,
        binaryData?: ArrayBuffer
    }> {
        const arrayBuffer: ArrayBuffer = await this.encodeFromUriToArrayBuffer(uri);
        const jsonAndBuffer: {
            json: JsonSdtf,
            binaryData?: ArrayBuffer
        } = await this.encodeFromArrayBufferToJson(arrayBuffer);
        return jsonAndBuffer;
    }
}