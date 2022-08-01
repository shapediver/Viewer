import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { singleton } from 'tsyringe'
import { ShapeDiverViewerConnectionError } from '../logger/ShapeDiverViewerErrors';
import { HttpResponse } from './HttpResponse';

const errorHandler = (error: any) => {
    if (error.response) {
        // Request was made and server responded with 4xx or 5xx
        const resp = error.response as AxiosResponse
        throw new ShapeDiverViewerConnectionError( error.message || resp.data.message || (resp.data.desc || (resp.data.error ?? "")), resp.status, resp.data.error ?? "")
    } else if (error.request) {
        // The request was made but no response was received
        throw new ShapeDiverViewerConnectionError("The request was made but no response was received.")
    } else {
        // Something happened in setting up the request that triggered an Error
        throw new ShapeDiverViewerConnectionError(error.message)
    }
}

@singleton()
export class HttpClient {
    // #region Properties (2)

    private _dataCache: {
        [key: string]: Promise<HttpResponse<any>>
    } = {};

    private _sessionLoading: {
        [key: string]: {
            getAsset: (url: string) => Promise<[ArrayBuffer, string, string]>,
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
                throw errorHandler(error);
            });
        axios.interceptors.request.use(
            response => {
                return response;
            },
            error => {
                throw errorHandler(error);
            });
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    private getSessionId(href: string): string | undefined {
        // searching for "/session/SESSION_ID/{'output' | 'export' | 'texture'}/ASSET_DATA"
        const parts = href.split('/');
        const sessionPartIndex = parts.indexOf('session');

        // There have to be at exactly 4 parts, including the session
        if (sessionPartIndex !== -1 && parts.length === sessionPartIndex + 4) {
            const sessionId = parts[sessionPartIndex + 1];
            // no such session has been registered, should never happen
            if (!this._sessionLoading[sessionId]) return;
            return sessionId;
        }
        return;
    }

    public addDataLoading(sessionId: string, callbacks: {
        getAsset: (url: string) => Promise<[ArrayBuffer, string, string]>,
        downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
    }) {
        this._sessionLoading[sessionId] = callbacks;
    }

    public async get(href: string, config: AxiosRequestConfig = { responseType: 'arraybuffer' }, textureLoading: boolean = false): Promise<HttpResponse<any>> {
        const dataKey = btoa(href);
        if (dataKey in this._dataCache) return await this._dataCache[dataKey];
        
        // try to get sessionId from href
        let sessionId = this.getSessionId(href);

        // if href does not have sessionId, use the first sesison, if available
        if(!sessionId && Object.keys(this._sessionLoading).length > 0)
            sessionId = Object.keys(this._sessionLoading)[0];
        
        // get the session loading functions, if available
        let sessionLoading: { 
            getAsset: (url: string) => Promise<[ArrayBuffer, string, string]>,
            downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
        } | undefined;
        if(sessionId)
            sessionLoading = this._sessionLoading[sessionId];

        // separation texture vs everything else
        if(textureLoading) {
            // if we have a sessionId and the sessionLoading functions and the image is not a blob or data, we load it via the sdk
            if(sessionLoading !== undefined && sessionId !== undefined && !href.startsWith('blob:') && !href.startsWith('data:')) {
                // take first session to load a texture that is not session related
                this._dataCache[dataKey] = new Promise<HttpResponse<any>>(resolve => {
                    sessionLoading!.downloadTexture(sessionId!, href).then((result) => {
                        resolve({
                            data: result[0],
                            headers: {
                                'content-type': result[1]
                            }
                        })
                    });
                });
            } else {
                // we can load blobs and data urls directly
                // or load it directly if we don't have a session
                this._dataCache[dataKey] = axios(href, Object.assign({ method: 'get' }, config));
            }
        } else {
            if(!sessionLoading) {
                // if there is no session to load from, we use the fallback option
                this._dataCache[dataKey] = axios(href, Object.assign({ method: 'get' }, config));
            } else {
                // all data links where we could somehow find a session to load it with
                this._dataCache[dataKey] = new Promise<HttpResponse<ArrayBuffer>>((resolve, reject) => {
                    sessionLoading!.getAsset(href)
                        .then((result) => {
                            resolve({
                                data: result[0],
                                headers: {
                                    'content-type': result[1]
                                }
                            })
                        })
                        .catch((e) => {
                            // if this fails, we just load it directly
                            resolve(axios(href, Object.assign({ method: 'get' }, config)))
                        })
                });
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