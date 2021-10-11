import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { HttpClient, Logger, LOGGINGTOPIC, PerformanceEvaluator, SDError } from '@shapediver/viewer.shared.services'
import { ShapeDiverResponseOutputPart } from '@shapediver/api.geometry-api-dto-v1'

import { GLTFLoader as GLTF_v1Loader } from './gltfv1/GLTFLoader'
import { GLTFLoader as GLTF_v2Loader } from './gltfv2/GLTFLoader'
import { GLTFConverter } from './gltfv2/GLTFConverter'

@singleton()
export class GeometryEngine {
    // #region Properties (1)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;

    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

    // #endregion Properties (1)

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

        if (!content || (content && !content.href)) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryEngine.loadContent: Invalid content was provided to geometry engine.'), '', false);
            return new TreeNode();
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
                if (e.response && e.response.status) {
                    this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, e, `GeometryEngine.loadContent: Initial loading of geometry failed.`, e.response.status, false)
                } else {
                    this._logger.error(LOGGINGTOPIC.DATAPROCESSING, e, `GeometryEngine.loadContent: Initial loading of geometry failed.`, false)
                }
                return new TreeNode();
            }

            const magic = new TextDecoder().decode(new Uint8Array(axiosResponse.data, 0, 4));
            const isBinary = magic === 'glTF' || (axiosResponse.headers['content-type'] &&
                (axiosResponse.headers['content-type'] === 'model/gltf-binary' ||
                    axiosResponse.headers['content-type'] === 'application/octet-stream' ||
                    axiosResponse.headers['content-type'] === 'model/gltf.binary'));

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
                    this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryEngine.loadContent: Invalid data: glTF magic wrong.'));
                    return new TreeNode();
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
                        this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryEngine.loadContent: glTF header version (' + gltfHeader.version + ') is not the same as asset version (' + assetVersion + ').'));
                        return new TreeNode();
                    }
                } else {
                    version = gltfHeader.version + '.0';
                }
            } else {
                gltfContent = JSON.parse(new TextDecoder().decode(axiosResponse.data));

                if(gltfContent && gltfContent.asset && gltfContent.asset.version) {
                    if(gltfContent.asset.version !== '2.0'){
                        this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryEngine.loadContent: Only gltf v2 is supported in a non-binary format.'));
                        return new TreeNode();
                    }
                } else {
                    this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, 'GeometryEngine.loadContent: No version specified in asset, trying to load as v2.');
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

    public async convertSceneToGLTF(node: TreeNode, convertForAR = false): Promise<any | string | ArrayBuffer | null> {
        return new GLTFConverter().convert(node, convertForAR);
    }

    // #endregion Public Methods (1)
}