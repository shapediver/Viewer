import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { singleton } from 'tsyringe';


@singleton()
export class HttpClient {

    private readonly _cache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};

    constructor() {
        axios.interceptors.response.use(response => { return response; }, error => { throw error; });
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        if (!this._cache[url])
            this._cache[url] = axios(url, Object.assign({method: 'get', timeout: 30000}, config));
        return this._cache[url];
    };

    public async post(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({method: 'post', timeout: 30000}, config));
    };

    public async put(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({method: 'put', timeout: 30000}, config));
    };
}