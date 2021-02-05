import { container, singleton } from "tsyringe";
import { Logger } from "@shapediver/viewer.monitoring.logger";

@singleton()
export class ErrorHandler {

    private readonly _logger: Logger;

    constructor() {
        this._logger = <Logger>container.resolve(Logger);
    }

    public handle(error: Error) {
        this._logger.error(error.message);
    }

    public handleHttpError(httpError: number, error: Error) {

        if(httpError.toString()[0] === '1') {
            switch (httpError) {
                case 100:
                    this._logger.info('Http-Code ' + httpError + ': Continue. ' + error.message);
                    break;
                case 101:
                    this._logger.info('Http-Code ' + httpError + ': Switching Protocols. ' + error.message);
                    break;
                case 102:
                    this._logger.info('Http-Code ' + httpError + ': Processing. ' + error.message);
                    break;
                case 103:
                    this._logger.info('Http-Code ' + httpError + ': Early Hints. ' + error.message);
                    break;
                default:
                    this._logger.info('Http-Code ' + httpError + ': Unknown Informational Response. ' + error.message);
            }
        } else if(httpError.toString()[0] === '2') {
            switch (httpError) {
                case 200:
                    this._logger.info('Http-Code ' + httpError + ': OK. ' + error.message);
                    break;
                case 201:
                    this._logger.info('Http-Code ' + httpError + ': Created. ' + error.message);
                    break;
                case 202:
                    this._logger.info('Http-Code ' + httpError + ': Accepted. ' + error.message);
                    break;
                case 203:
                    this._logger.info('Http-Code ' + httpError + ': Non-Authoritative Information. ' + error.message);
                    break;
                case 204:
                    this._logger.info('Http-Code ' + httpError + ': No Content. ' + error.message);
                    break;
                case 205:
                    this._logger.info('Http-Code ' + httpError + ': Reset Content. ' + error.message);
                    break;
                case 206:
                    this._logger.info('Http-Code ' + httpError + ': Partial Content. ' + error.message);
                    break;
                case 207:
                    this._logger.info('Http-Code ' + httpError + ': Multi-Status. ' + error.message);
                    break;
                case 208:
                    this._logger.info('Http-Code ' + httpError + ': Already Reported. ' + error.message);
                    break;
                case 226:
                    this._logger.info('Http-Code ' + httpError + ': IM Used. ' + error.message);
                    break;
                default:
                    this._logger.info('Http-Code ' + httpError + ': Unknown Success Message. ' + error.message);
            }
        } else if(httpError.toString()[0] === '3') {
            switch (httpError) {
                case 300:
                    this._logger.warn('Http-Code ' + httpError + ': Multiple Choices. ' + error.message);
                    break;
                case 301:
                    this._logger.warn('Http-Code ' + httpError + ': Moved Permanently. ' + error.message);
                    break;
                case 302:
                    this._logger.warn('Http-Code ' + httpError + ': Found (Previously "Moved temporarily"). ' + error.message);
                    break;
                case 303:
                    this._logger.warn('Http-Code ' + httpError + ': See Other. ' + error.message);
                    break;
                case 304:
                    this._logger.warn('Http-Code ' + httpError + ': Not Modified. ' + error.message);
                    break;
                case 305:
                    this._logger.warn('Http-Code ' + httpError + ': Use Proxy. ' + error.message);
                    break;
                case 306:
                    this._logger.warn('Http-Code ' + httpError + ': Switch Proxy. ' + error.message);
                    break;
                case 307:
                    this._logger.warn('Http-Code ' + httpError + ': Temporary Redirect. ' + error.message);
                    break;
                case 308:
                    this._logger.warn('Http-Code ' + httpError + ': Permanent Redirect. ' + error.message);
                    break;
                default:
                    this._logger.warn('Http-Code ' + httpError + ': Unknown Redirection Error. ' + error.message);
            }
        } else if(httpError.toString()[0] === '4') {
            switch (httpError) {
                case 400:
                    this._logger.error('Http-Code ' + httpError + ': Bad Request. ' + error.message);
                    break;
                case 401:
                    this._logger.error('Http-Code ' + httpError + ': Unauthorized. ' + error.message);
                    break;
                case 402:
                    this._logger.error('Http-Code ' + httpError + ': Payment Required. ' + error.message);
                    break;
                case 403:
                    this._logger.error('Http-Code ' + httpError + ': Forbidden. ' + error.message);
                    break;
                case 404:
                    this._logger.error('Http-Code ' + httpError + ': Not Found. ' + error.message);
                    break;
                case 405:
                    this._logger.error('Http-Code ' + httpError + ': Method Not Allowed. ' + error.message);
                    break;
                case 406:
                    this._logger.error('Http-Code ' + httpError + ': Not Acceptable. ' + error.message);
                    break;
                case 407:
                    this._logger.error('Http-Code ' + httpError + ': Proxy Authentication Required. ' + error.message);
                    break;
                case 408:
                    this._logger.error('Http-Code ' + httpError + ': Request Timeout. ' + error.message);
                    break;
                case 409:
                    this._logger.error('Http-Code ' + httpError + ': Conflict. ' + error.message);
                    break;
                case 410:
                    this._logger.error('Http-Code ' + httpError + ': Gone. ' + error.message);
                    break;
                case 411:
                    this._logger.error('Http-Code ' + httpError + ': Length Required. ' + error.message);
                    break;
                case 412:
                    this._logger.error('Http-Code ' + httpError + ': Precondition Failed. ' + error.message);
                    break;
                case 413:
                    this._logger.error('Http-Code ' + httpError + ': Payload Too Large. ' + error.message);
                    break;
                case 414:
                    this._logger.error('Http-Code ' + httpError + ': URI Too Long. ' + error.message);
                    break;
                case 415:
                    this._logger.error('Http-Code ' + httpError + ': Unsupported Media Type. ' + error.message);
                    break;
                case 416:
                    this._logger.error('Http-Code ' + httpError + ': Range Not Satisfiable. ' + error.message);
                    break;
                case 417:
                    this._logger.error('Http-Code ' + httpError + ': Expectation Failed. ' + error.message);
                    break;
                case 421:
                    this._logger.error('Http-Code ' + httpError + ': Misdirected Request. ' + error.message);
                    break;
                case 422:
                    this._logger.error('Http-Code ' + httpError + ': Unprocessable Entity. ' + error.message);
                    break;
                case 423:
                    this._logger.error('Http-Code ' + httpError + ': Locked. ' + error.message);
                    break;
                case 424:
                    this._logger.error('Http-Code ' + httpError + ': Failed Dependency. ' + error.message);
                    break;
                case 425:
                    this._logger.error('Http-Code ' + httpError + ': Too Early. ' + error.message);
                    break;
                case 426:
                    this._logger.error('Http-Code ' + httpError + ': Upgrade Required. ' + error.message);
                    break;
                case 428:
                    this._logger.error('Http-Code ' + httpError + ': Precondition Required. ' + error.message);
                    break;
                case 429:
                    this._logger.error('Http-Code ' + httpError + ': Too Many Requests. ' + error.message);
                    break;
                case 431:
                    this._logger.error('Http-Code ' + httpError + ': Request Header Fields Too Large. ' + error.message);
                    break;
                case 451:
                    this._logger.error('Http-Code ' + httpError + ': Unavailable For Legal Reasons. ' + error.message);
                    break;
                case 418:
                    this._logger.error('Http-Code ' + httpError + ': I\'m a teapot. ' + error.message);
                    break;
                case 420:
                    this._logger.error('Http-Code ' + httpError + ': Policy Not Fulfilled. ' + error.message);
                    break;
                case 444:
                    this._logger.error('Http-Code ' + httpError + ': No Response. ' + error.message);
                    break;
                case 449:
                    this._logger.error('Http-Code ' + httpError + ': The request should be retried after doing the appropriate action. ' + error.message);
                    break;
                case 499:
                    this._logger.error('Http-Code ' + httpError + ': Client Closed Request. ' + error.message);
                    break;
                default:
                    this._logger.error('Http-Code ' + httpError + ': Unknown Client Error. ' + error.message);
            }
        } else if(httpError.toString()[0] === '5') {
            switch (httpError) {
                case 500:
                    this._logger.error('Http-Code ' + httpError + ': Internal Server Error. ' + error.message);
                    break;
                case 501:
                    this._logger.error('Http-Code ' + httpError + ': Not Implemented. ' + error.message);
                    break;
                case 502:
                    this._logger.error('Http-Code ' + httpError + ': Bad Gateway. ' + error.message);
                    break;
                case 503:
                    this._logger.error('Http-Code ' + httpError + ': Service Unavailable. ' + error.message);
                    break;
                case 504:
                    this._logger.error('Http-Code ' + httpError + ': Gateway Timeout. ' + error.message);
                    break;
                case 505:
                    this._logger.error('Http-Code ' + httpError + ': HTTP Version Not Supported. ' + error.message);
                    break;
                case 506:
                    this._logger.error('Http-Code ' + httpError + ': Variant Also Negotiates. ' + error.message);
                    break;
                case 507:
                    this._logger.error('Http-Code ' + httpError + ': Insufficient Storage. ' + error.message);
                    break;
                case 508:
                    this._logger.error('Http-Code ' + httpError + ': Loop Detected. ' + error.message);
                    break;
                case 510:
                    this._logger.error('Http-Code ' + httpError + ': Not Extended. ' + error.message);
                    break;
                case 511:
                    this._logger.error('Http-Code ' + httpError + ': Network Authentication Required. ' + error.message);
                    break;
                default:
                    this._logger.error('Http-Code ' + httpError + ': Unknown Server Error. ' + error.message);
            }
        } else {
            this._logger.error('Http-Code ' + httpError + ': Unknown Error Code. ' + error.message);
        }

       
    }
}