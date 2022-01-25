import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class HttpClient {
    private _loadData?: (img: string, config?: AxiosRequestConfig) => Promise<Blob | HTMLImageElement>;
    private _dataCache: {
        [key: string]: Promise<Blob | HTMLImageElement>
    } = {};

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
        const dataKey = btoa(href);
        if(this._dataCache[dataKey]) return await this._dataCache[dataKey];

        this._dataCache[dataKey] = new Promise<Blob | HTMLImageElement>(async resolve => {
            if (this._loadData){
                const response = await this._loadData(href, config);
                resolve(response);
            }

            const response = await this.get(href, config);
            const bitmapContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'];
            if(response.headers && response.headers['content-type'] && bitmapContentTypes.includes(response.headers['content-type'])) {
                const img = new Image();
                const promise = new Promise<void>(resolve => {
                  img.onload = () => resolve();
                })
                img.crossOrigin = "anonymous";
                img.src = href;
                await promise;
                resolve(img);
            } else {
                resolve(response.data);
            }
        });

        return await this._dataCache[dataKey];
    }

    public addDataLoading(value: (img: string, config?: AxiosRequestConfig) => Promise<Blob | HTMLImageElement>) {
        this._loadData = value;
    }

    public removeDataLoading() {
        this._loadData = undefined;
    }
}