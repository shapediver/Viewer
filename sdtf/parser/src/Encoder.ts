import { HttpClient, SDError, Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.services'
import { JsonSdtf } from '@shapediver/viewer.sdtf.shared'
import { container } from 'tsyringe'

/**
 * Encoder that can encode from uri to json with various steps.
 * 1. from uri to array buffer
 * 2. from uri to json
 * 3. from array buffer to json
 */
export class Encoder {
    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    /**
     * Encoding from uri to array buffer
     * 
     * @param uri the uri to encode
     * @returns a promise for the array buffer
     */
    public async encodeFromUriToArrayBuffer(uri: string): Promise<ArrayBuffer | null> {
        if (uri === '') {
            return null;
        }

        let axiosResponse;
        try {
            axiosResponse = await this._httpClient.get(uri, {
                responseType: 'arraybuffer'
            });
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.SDTF, e, `Encoder.encodeFromUriToArrayBuffer: Was not able to get array buffer from uri.`, e.response.status, false)
              } else {
                this._logger.error(LOGGINGTOPIC.SDTF, e, `Encoder.encodeFromUriToArrayBuffer: Was not able to get array buffer from uri.`, false)
            }
            return null;
        }

        if (axiosResponse.headers['content-type'] && axiosResponse.headers['content-type'] === 'model/vnd.sdtf') {
            if (axiosResponse.data instanceof ArrayBuffer) {
                return axiosResponse.data;
            } else {
                return (<Uint8Array>axiosResponse.data).buffer
            }
        } else {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('Encoder.encodeFromUriToArrayBuffer: Non-binary SDTF encoding not implemented.'));
            return null;
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
    } | null> {
        const headerDataView = new DataView(arrayBuffer, 0, this.BINARY_EXTENSION_HEADER_LENGTH);

        const magic = String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3));
        if (magic !== 'sdtf') {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('Encoder.encodeFromArrayBufferToJson: Invalid data: sdtf magic wrong.'));
            return null;
        } 
        const version = headerDataView.getUint32(4, true);
        if (version !== 1) {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError(`Encoder.encodeFromArrayBufferToJson: Invalid version: sdtf loader does not support version ${version}.`));
            return null;
        } 
        const totalLength = headerDataView.getUint32(8, true);
        const contentLength = headerDataView.getUint32(12, true);
        const contentFormat = headerDataView.getUint32(16, true);
        if (contentFormat !== 0) {
            this._logger.error(LOGGINGTOPIC.SDTF, new SDError('Encoder.encodeFromArrayBufferToJson: Content format is not Json (0), content invalid.'));
            return null;
        }

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
    } | null> {
        const arrayBuffer = await this.encodeFromUriToArrayBuffer(uri);
        if(!arrayBuffer) return null;
        const jsonAndBuffer = await this.encodeFromArrayBufferToJson(arrayBuffer);
        return jsonAndBuffer;
    }
}