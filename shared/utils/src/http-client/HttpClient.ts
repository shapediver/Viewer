import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '@shapediver/viewer.shared.monitoring'
import { container, singleton } from 'tsyringe';


@singleton()
export class HttpClient {
    private readonly _logger = <Logger>container.resolve(Logger);

    private readonly _cache: {
        [key: string]: Promise<AxiosResponse<any>>
    } = {};

    public get(url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        try {
            if (!this._cache[url])
                this._cache[url] = axios.get(url, config);
            return this._cache[url];
        } catch (e) {
            if (e.response)
                this._logger.httpError(e.response.status, e);
            this._logger.error('HttpClient failed in get request', e);
            throw e;
        }
    };

    public post(url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        try {
            return axios.post(url, data, config);
        } catch (e) {
            if (e.response)
                this._logger.httpError(e.response.status, e);
            this._logger.error('HttpClient failed in post request', e);
            throw e;
        }
    };
}