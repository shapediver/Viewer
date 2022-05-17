import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { HttpClient, Logger, LOGGING_TOPIC, PerformanceEvaluator, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'

import { GLTFLoader as GLTF_v1Loader } from './gltfv1/GLTFLoader'
import { GLTFLoader as GLTF_v2Loader } from './gltfv2/GLTFLoader'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

@singleton()
export class GeometryEngine {
    // #region Properties (4)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (2)
    
    /**
     * Load the geometry content into a scene graph node.
     * 
     * @param content the geometry content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        if (!content || (content && !content.href)) {
            const error = new ShapeDiverViewerDataProcessingError('GeometryEngine cannot load content.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryEngine.loadContent`, error);
        }

        const url = content.href;
        let gltfContent, gltfBinary, gltfBaseUrl, gltfHeader;
        let version = '2.0';

        if (content.format === 'glb' || content.format === 'gltf') {
            this._performanceEvaluator.startSection('gltfProcessing.' + url);
            let axiosResponse;

            try {
                this._performanceEvaluator.startSection('loadGltf.' + url);
                axiosResponse = await this._httpClient.get(url!, {
                    responseType: 'arraybuffer'
                });
                this._performanceEvaluator.endSection('loadGltf.' + url);
            } catch (e) {
                throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryEngine.loadContent`, e);
            }

            const magic = new TextDecoder().decode(new Uint8Array(axiosResponse.data, 0, 4));
            const isBinary = magic === 'glTF';

            if (isBinary) {
                gltfBinary = axiosResponse.data;
                // create header data
                const headerDataView = new DataView(gltfBinary, 0, this.BINARY_EXTENSION_HEADER_LENGTH);
                gltfHeader = {
                    magic: magic,
                    version: headerDataView.getUint32(4, true),
                    length: headerDataView.getUint32(8, true),
                    contentLength: headerDataView.getUint32(12, true),
                    contentFormat: headerDataView.getUint32(16, true)
                }
                if (gltfHeader.magic != 'glTF') {
                    const error = new ShapeDiverViewerDataProcessingError('Invalid data: glTF magic wrong.');
                    throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryEngine.loadContent`, error);
                }
                // create content
                const contentDataView = new DataView(gltfBinary, this.BINARY_EXTENSION_HEADER_LENGTH, gltfHeader.contentLength);
                const contentDecoded = new TextDecoder().decode(contentDataView);
                gltfContent = JSON.parse(contentDecoded);

                if(gltfContent && gltfContent.asset && gltfContent.asset.version) {
                    const assetVersion = (gltfContent.asset.version + '').endsWith('.0') ? gltfContent.asset.version : gltfContent.asset.version + '.0';
                    if(gltfHeader.version + '.0' === assetVersion) {
                        version = gltfHeader.version + '.0';
                    } else {
                        const error = new ShapeDiverViewerDataProcessingError('GeometryEngine.loadContent: glTF header version (' + gltfHeader.version + ') is not the same as asset version (' + assetVersion + ').');
                        throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryEngine.loadContent`, error);
                    }
                } else {
                    version = gltfHeader.version + '.0';
                }
            } else {
                gltfContent = JSON.parse(new TextDecoder().decode(axiosResponse.data));

                if(gltfContent && gltfContent.asset && gltfContent.asset.version) {
                    if(gltfContent.asset.version !== '2.0'){
                        const error = new ShapeDiverViewerDataProcessingError('GeometryEngine.loadContent: Only gltf v2 is supported in a non-binary format.');
                        throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryEngine.loadContent`, error);
                    }
                } else {
                    this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'GeometryEngine.loadContent: No version specified in asset, trying to load as v2.');
                    version = '2.0';
                }

                const removeLastDirectoryPartOf = (the_url: string): string => {
                    const dir_char = the_url.includes("/") ? "/" : "\\";
                    const the_arr = the_url.split(dir_char);
                    the_arr.pop();
                    return the_arr.join(dir_char);
                }

                gltfBaseUrl = removeLastDirectoryPartOf(url!);
                if (!gltfBaseUrl && window && window.location && window.location.href)
                    gltfBaseUrl = removeLastDirectoryPartOf(window.location.href);
            }
        }

        let node;
        if (version === '1.0') {
            node = await new GLTF_v1Loader().load(gltfContent, gltfBinary, gltfHeader, gltfBaseUrl);
        } else {
            node = await new GLTF_v2Loader().load(gltfContent, gltfBinary, gltfHeader, gltfBaseUrl);
        }
        this._performanceEvaluator.endSection('gltfProcessing.' + url);

        return node;
    }

    // #endregion Public Methods (2)
}