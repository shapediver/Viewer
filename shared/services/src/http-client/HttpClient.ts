import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { singleton } from 'tsyringe'
import { ShapeDiverError } from '../logger/ShapeDiverError';

@singleton()
export class HttpClient {

    private readonly _cache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};
    private _loadData?: (img: string, config?: AxiosRequestConfig) => Promise<Blob>;

    constructor() {
        axios.interceptors.response.use(
            response => {
                return response;
            },
            error => {
                throw error;
            });
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'get' }, config));
    };

    public async post(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'post' }, config));
    };

    public async put(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'put' }, config));
    };

    public async patch(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({ method: 'patch' }, config));
    };

    public async loadData(href: string, config: AxiosRequestConfig = { responseType: 'blob' }): Promise<any> {
        if (this._loadData)
            return await this._loadData(href, config);

        const response = await this.get(
            href,
            config
        );
        return response.data;
    }

    public addDataLoading(value: (img: string, config?: AxiosRequestConfig) => Promise<any>) {
        this._loadData = value;
    }

    public removeDataLoading() {
        this._loadData = undefined;
    }
}