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
    private _loadData?: (img: string, config?: AxiosRequestConfig) => Promise<HttpResponse<any>>;

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

    public addDataLoading(value: (img: string, config?: AxiosRequestConfig) => Promise<HttpResponse<any>>) {
        this._loadData = value;
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponse<any>> {
        return axios(url, Object.assign({ method: 'get' }, config));
    }

    public async loadData(href: string, config: AxiosRequestConfig = { responseType: 'arraybuffer' }): Promise<HttpResponse<ArrayBuffer>> {
        const dataKey = btoa(href);
        if (this._dataCache[dataKey]) return await this._dataCache[dataKey];

        if (this._loadData) {
            this._dataCache[dataKey] = this._loadData(href, config);
        } else {
            this._dataCache[dataKey] = this.get(href, config);
        }

        return await this._dataCache[dataKey];
    }

    public async patch(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponse<any>> {
        return axios(url, Object.assign({ method: 'patch' }, config));
    }

    public async post(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponse<any>> {
        return axios(url, Object.assign({ method: 'post' }, config));
    }

    public async put(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponse<any>> {
        return axios(url, Object.assign({ method: 'put' }, config));
    }

    public removeDataLoading() {
        this._loadData = undefined;
    }

    // #endregion Public Methods (7)
}