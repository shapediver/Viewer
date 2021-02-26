import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorHandler } from '@shapediver/viewer.monitoring.error-handler'
import { container, singleton } from 'tsyringe';


@singleton()
export class HttpClient {
    private readonly _errorHandler = <ErrorHandler>container.resolve(ErrorHandler);

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
                this._errorHandler.handleHttpError(e.response.status, e);
            this._errorHandler.handle(e);
            throw e;
        }
    };

    public post(url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> {
        try {
            return axios.post(url, data, config);
        } catch (e) {
            if (e.response)
                this._errorHandler.handleHttpError(e.response.status, e);
            this._errorHandler.handle(e);
            throw e;
        }
    };
}