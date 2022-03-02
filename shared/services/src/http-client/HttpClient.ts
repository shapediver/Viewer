import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { container, singleton } from 'tsyringe'
import { Converter } from '../converter/Converter';

@singleton()
export class HttpClient {
    // #region Properties (2)

    private _dataCache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};
    private _loadData?: (img: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<any>>;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        axios.interceptors.response.use(
            response => {
                return response;
            },
            error => {
                throw error;
            });
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public addDataLoading(value: (img: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<any>>) {
        this._loadData = value;
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'get' }, config));
    }

    public async loadData(href: string, config: AxiosRequestConfig = { responseType: 'blob' }): Promise<AxiosResponse<any>> {
        const dataKey = btoa(href);
        if(this._dataCache[dataKey]) return await this._dataCache[dataKey];

        this._dataCache[dataKey] = new Promise<AxiosResponse<any>>(async resolve => {
            if (this._loadData){
                const response = await this._loadData(href, config);
                resolve(response);
            } else {
                const response = await this.get(href, config);
                resolve(response);
            }
        });

        return await this._dataCache[dataKey];
    }

    public async patch(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'patch' }, config));
    }

    public async post(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'post' }, config));
    }

    public async put(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'put' }, config));
    }

    public removeDataLoading() {
        this._loadData = undefined;
    }

    // #endregion Public Methods (7)
}