import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class HttpClient {

    private readonly _cache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};

    constructor() {
        axios.interceptors.response.use(response => { return response; }, error => { throw error; });
    }

    public async get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({method: 'get'}, config));
    };

    public async post(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({method: 'post'}, config));
    };

    public async put(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        return axios(url, Object.assign({method: 'put'}, config));
    };
}