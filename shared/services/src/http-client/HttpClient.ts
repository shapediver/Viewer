import axios, { AxiosRequestConfig } from 'axios'
import { singleton } from 'tsyringe'
import { ShapeDiverViewerConnectionError } from '../logger/ShapeDiverViewerErrors';
import { HttpResponse } from './HttpResponse';

@singleton()
export class HttpClient {
    // #region Properties (2)

    private _dataCache: {
        [key: string]: Promise<HttpResponse<any>>
    } = {};

    private _sessionLoading: {
        [key: string]: {
            getOutput: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
            getTexture: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
            getExport: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
            downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
        }
    } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        axios.interceptors.response.use(
            response => {
                return response;
            },
            error => {
                throw new ShapeDiverViewerConnectionError(error.message, error.response.status, error);
            });
        axios.interceptors.request.use(
            response => {
                return response;
            },
            error => {
                throw new ShapeDiverViewerConnectionError(error.message, undefined, error);
            });
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    private loadingCriterion(href: string): { sessionId: string, assetData: string, type: 'output' | 'export' | 'texture' } | undefined {
        // searching for "/session/SESSION_ID/{'output' | 'export' | 'texture'}/ASSET_DATA"
        const parts = href.split('/');
        const sessionPartIndex = parts.indexOf('session');

        // There have to be at exactly 4 parts, including the session
        if (sessionPartIndex !== -1 && parts.length === sessionPartIndex + 4) {
            const sessionId = parts[sessionPartIndex + 1];
            // no such session has been registered, should never happen
            if (!this._sessionLoading[sessionId]) return;

            const type = parts[sessionPartIndex + 2];
            // the type is not supported
            if (type !== 'output' && type !== 'export' && type !== 'texture') return;

            const assetData = parts[sessionPartIndex + 3];

            return { sessionId, assetData, type };
        }

        return;
    }

    public addDataLoading(sessionId: string, callbacks: {
        getOutput: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
        getTexture: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
        getExport: (sessionId: string, assetData: string) => Promise<[ArrayBuffer, string]>,
        downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
    }) {
        this._sessionLoading[sessionId] = callbacks;
    }

    public async get(href: string, config?: AxiosRequestConfig | undefined, textureLoading: boolean = false): Promise<HttpResponse<any>> {
        const dataKey = btoa(href);
        if (this._dataCache[dataKey]) return await this._dataCache[dataKey];

        const loadingInfo = this.loadingCriterion(href);
        if (loadingInfo) {
            switch (loadingInfo.type) {
                case 'output':
                    this._dataCache[dataKey] = new Promise<HttpResponse<ArrayBuffer>>(resolve => {
                        this._sessionLoading[loadingInfo.sessionId]
                            .getOutput(loadingInfo.sessionId, loadingInfo.assetData)
                            .then(result => {
                                resolve({
                                    data: result[0],
                                    headers: {
                                        'content-type': result[1]
                                    }
                                })
                            })

                    });

                case 'export':
                    this._dataCache[dataKey] = new Promise<HttpResponse<ArrayBuffer>>(resolve => {
                        this._sessionLoading[loadingInfo.sessionId]
                            .getExport(loadingInfo.sessionId, loadingInfo.assetData)
                            .then(result => {
                                resolve({
                                    data: result[0],
                                    headers: {
                                        'content-type': result[1]
                                    }
                                })
                            })

                    });

                case 'texture':
                    this._dataCache[dataKey] = new Promise<HttpResponse<ArrayBuffer>>(resolve => {
                        this._sessionLoading[loadingInfo.sessionId]
                            .getTexture(loadingInfo.sessionId, loadingInfo.assetData)
                            .then(result => {
                                resolve({
                                    data: result[0],
                                    headers: {
                                        'content-type': result[1]
                                    }
                                })
                            })

                    });

                default:
                    this._dataCache[dataKey] = axios(href, Object.assign({ method: 'get' }, config));
            }
        } else {
            // separation texture vs something else...
            if(textureLoading) {
                // we can load blobs and data urls directly
                // if no session is registered, we have to load the texture directly
                if(href.startsWith('blob:') || href.startsWith('data:') ||  Object.values(this._sessionLoading).length === 0) {
                    this._dataCache[dataKey] = axios(href, Object.assign({ method: 'get' }, config));
                } else {
                    // take first session to load a texture that is not session related
                    const sessionId = Object.keys(this._sessionLoading)[0];

                    this._dataCache[dataKey] = new Promise<HttpResponse<any>>(resolve => {
                        this._sessionLoading[sessionId].downloadTexture(sessionId, href).then((result) => {
                            resolve({
                                data: result[0],
                                headers: {
                                    'content-type': result[1]
                                }
                            })
                        });
                    });
                }
            } else {
                this._dataCache[dataKey] = axios(href, Object.assign({ method: 'get' }, config));
            }
        }

        return this._dataCache[dataKey];
    }

    public async loadTexture(href: string): Promise<HttpResponse<ArrayBuffer>> {
        return this.get(href, undefined, true);
    }

    public removeDataLoading(sessionId: string) {
        delete this._sessionLoading[sessionId];
    }

    // #endregion Public Methods (7)
}