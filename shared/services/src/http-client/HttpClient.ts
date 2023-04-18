import axios, { AxiosRequestConfig } from 'axios'
import { HttpResponse } from './HttpResponse';

export class HttpClient {
    // #region Properties (3)

    private static _instance: HttpClient;

    private _sessionLoading: {
        [key: string]: {
            getAsset: (url: string) => Promise<[ArrayBuffer, string, string]>,
            downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
        }
    } = {};

    // #endregion Properties (3)

    // #region Constructors (1)

    private constructor() {}

    // #endregion Constructors (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (4)

    public addDataLoading(sessionId: string, callbacks: {
        getAsset: (url: string) => Promise<[ArrayBuffer, string, string]>,
        downloadTexture: (sessionId: string, url: string) => Promise<[ArrayBuffer, string]>,
    }) {
        this._sessionLoading[sessionId] = callbacks;
    }

    public async get(href: string, config: AxiosRequestConfig = { responseType: 'arraybuffer' }, textureLoading: boolean = false): Promise<HttpResponse<any>> {
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
                return new Promise<HttpResponse<any>>((resolve, reject) => {
                    sessionLoading!.downloadTexture(sessionId!, href).then((result) => {
                        resolve({
                            data: result[0],
                            headers: {
                                'content-type': result[1]
                            }
                        })
                    }).catch(e => {
                        reject(e)
                    });
                });
            } else {
                // we can load blobs and data urls directly
                // or load it directly if we don't have a session
                return axios(href, Object.assign({ method: 'get' }, config));
            }
        } else {
            if(!sessionLoading) {
                // if there is no session to load from, we use the fallback option
                return axios(href, Object.assign({ method: 'get' }, config));
            } else {
                // all data links where we could somehow find a session to load it with
                return new Promise<HttpResponse<ArrayBuffer>>((resolve, reject) => {
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
    }

    public async loadTexture(href: string): Promise<HttpResponse<ArrayBuffer>> {
        return this.get(href, undefined, true);
    }

    public removeDataLoading(sessionId: string) {
        delete this._sessionLoading[sessionId];
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

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

    // #endregion Private Methods (1)
}