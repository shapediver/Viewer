import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '@shapediver/viewer.shared.monitoring'
import { container, singleton } from 'tsyringe';


@singleton()
export class HttpClient {
    private readonly _logger = <Logger>container.resolve(Logger);

    private readonly _cache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};

    constructor() {
        axios.interceptors.response.use(response => { return response; }, error => { throw error; });
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        if (!this._cache[url])
            this._cache[url] = axios.get(url, config);
        return this._cache[url];
    };

    public async post(url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios.post(url, data, config);
    };
}