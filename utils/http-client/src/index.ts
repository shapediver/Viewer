import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorHandler } from '@shapediver/viewer.monitoring.error-handler'
import { container } from 'tsyringe';

const errorHandler = <ErrorHandler>container.resolve(ErrorHandler);

const cache: {
  [key: string]: Promise<AxiosResponse<any>>
} = {};

const get = (url: string, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> => {
  try {
    if(!cache[url])
      cache[url] = axios.get(url, config);
    return cache[url];
  } catch (e) {
    if (e.response)
      errorHandler.handleHttpError(e.response.status, e);
    errorHandler.handle(e);
    throw e;
  }
};

const post = (url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<AxiosResponse<any>> => {
  try {
    return axios.post(url, data, config);
  } catch (e) {
    if (e.response)
      errorHandler.handleHttpError(e.response.status, e);
    errorHandler.handle(e);
    throw e;
  }
};

export default {
  get,
  post
}