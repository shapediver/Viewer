import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import { HttpClient, Logger, PerformanceEvaluator, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'

import { GLTFLoader as GLTF_v1Loader } from './gltfv1/GLTFLoader'
import { GLTFLoader as GLTF_v2Loader } from './gltfv2/GLTFLoader'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

export class GeometryEngine {
    // #region Properties (7)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = HttpClient.instance;
    private readonly _loadingQueue: Promise<ITreeNode>[] = [];
    private readonly _logger: Logger = Logger.instance;
    private readonly _performanceEvaluator = PerformanceEvaluator.instance;

    private static _instance: GeometryEngine;

    private _loadingQueueLength = Infinity;

    // #endregion Properties (7)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Accessors (2)

    public get parallelGlTFProcessing(): number {
        return this._loadingQueueLength;
    }

    public set parallelGlTFProcessing(value: number) {
        this._loadingQueueLength = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Load the geometry content into a scene graph node.
     * 
     * @param content the geometry content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        if (!content || (content && !content.href))
            throw new ShapeDiverViewerDataProcessingError('GeometryEngine cannot load content.');

        while(this._loadingQueueLength <= this._loadingQueue.length) 
            await new Promise(resolve => setTimeout(resolve, 10));

        const url = content.href!;
        // eslint-disable-next-line no-async-promise-executor
        const loadingPromise = new Promise<ITreeNode>(async (resolve) => {
            let gltfContent, gltfBinary, gltfBaseUrl, gltfHeader;
            let version = '2.0';
    
            if (content.format === 'glb' || content.format === 'gltf') {
                this._performanceEvaluator.startSection('gltfProcessing.' + url);
    
                this._performanceEvaluator.startSection('loadGltf.' + url);
                const axiosResponse = await this._httpClient.get(url!, {
                    responseType: 'arraybuffer'
                });
                this._performanceEvaluator.endSection('loadGltf.' + url);
    
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
                    if (gltfHeader.magic != 'glTF') 
                        throw new ShapeDiverViewerDataProcessingError('Invalid data: glTF magic wrong.');
                    
                    // create content
                    const contentDataView = new DataView(gltfBinary, this.BINARY_EXTENSION_HEADER_LENGTH, gltfHeader.contentLength);
                    const contentDecoded = new TextDecoder().decode(contentDataView);
                    gltfContent = JSON.parse(contentDecoded);
    
                    if(gltfContent && gltfContent.asset && gltfContent.asset.version) {
                        const assetVersion = (gltfContent.asset.version + '').endsWith('.0') ? gltfContent.asset.version : gltfContent.asset.version + '.0';
                        if(gltfHeader.version + '.0' === assetVersion) {
                            version = gltfHeader.version + '.0';
                        } else {
                            throw new ShapeDiverViewerDataProcessingError('GeometryEngine.loadContent: glTF header version (' + gltfHeader.version + ') is not the same as asset version (' + assetVersion + ').');
                        }
                    } else {
                        version = gltfHeader.version + '.0';
                    }
                } else {
                    gltfContent = JSON.parse(new TextDecoder().decode(axiosResponse.data));
    
                    if(gltfContent && gltfContent.asset && gltfContent.asset.version) {
                        if(gltfContent.asset.version !== '2.0')
                            throw new ShapeDiverViewerDataProcessingError('GeometryEngine.loadContent: Only gltf v2 is supported in a non-binary format.');
                    } else {
                        this._logger.warn('GeometryEngine.loadContent: No version specified in asset, trying to load as v2.');
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
            
            if (version === '1.0') {
                resolve(await new GLTF_v1Loader().load(gltfContent, gltfBinary, gltfHeader, gltfBaseUrl));
            } else {
                resolve(await new GLTF_v2Loader().load(gltfContent, gltfBinary, gltfHeader, gltfBaseUrl));
            }
        })

        this._loadingQueue.push(loadingPromise);
        const node = await loadingPromise;
        this._loadingQueue.splice(this._loadingQueue.indexOf(loadingPromise), 1);
       
        this._performanceEvaluator.endSection('gltfProcessing.' + url);

        return node;
    }

    // #endregion Public Methods (1)
}