import { singleton } from "tsyringe";

export enum LOGGINGLEVEL {
    NONE = 'none',
    ERROR = 'error',
    FATAL = 'fatal',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    DEBUG_HIGH = 'debug.high',
    DEBUG_MEDIUM = 'debug.medium',
    DEBUG_LOW = 'debug.low',
}

@singleton()
export class Logger {
    // #region Properties (2)

    private _loggingLevel: LOGGINGLEVEL = LOGGINGLEVEL.NONE;
    private _showMessages: boolean = true;

    // #endregion Properties (2)

    // #region Public Accessors (4)

    /**
     * Getter loggingLevel
     * @return {LOGGINGLEVEL}
     */
    public get loggingLevel(): LOGGINGLEVEL {
        return this._loggingLevel;
    }

    /**
     * Setter loggingLevel
     * @param {LOGGINGLEVEL} value
     */
    public set loggingLevel(value: LOGGINGLEVEL) {
        this._loggingLevel = value;
    }

    /**
     * Getter showMessages
     * @return {boolean}
     */
    public get showMessages(): boolean {
        return this._showMessages;
    }

    /**
     * Setter showMessages
     * @param {boolean} value
     */
    public set showMessages(value: boolean) {
        this._showMessages = value;
    }

    private canLog(loggingLevel: LOGGINGLEVEL): boolean {
        switch (this.loggingLevel) {
            case LOGGINGLEVEL.ERROR:
                if(loggingLevel === LOGGINGLEVEL.FATAL) return false;
                if(loggingLevel === LOGGINGLEVEL.WARN) return false;
                if(loggingLevel === LOGGINGLEVEL.INFO) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.FATAL:
                if(loggingLevel === LOGGINGLEVEL.WARN) return false;
                if(loggingLevel === LOGGINGLEVEL.INFO) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.WARN:
                if(loggingLevel === LOGGINGLEVEL.INFO) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.INFO:
                if(loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_HIGH:
                if(loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_MEDIUM:
                if(loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_LOW:
            case LOGGINGLEVEL.DEBUG:
            default:
                return true;
        }
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (8)

    /**
     * Logging a debug message.
     * @param msg the message
     */
    public debug(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.DEBUG) && this.showMessages === true)
            console.debug('(DEBUG) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with high priority.
     * @param msg the message
     */
    public debugHigh(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.DEBUG_HIGH) && this.showMessages === true)
            console.debug('(DEBUG_HIGH) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with low priority.
     * @param msg the message
     */
    public debugLow(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.DEBUG_LOW) && this.showMessages === true)
            console.debug('(DEBUG_LOW) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with medium priority.
     * @param msg the message
     */
    public debugMedium(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.DEBUG_MEDIUM) && this.showMessages === true)
            console.debug('(DEBUG_MEDIUM) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public error(msg: string, error?: Error, httpError?: number): void {
        if (httpError && error) {
            if(error) console.error(error);
            this.httpError(msg, error, httpError);
        } else {
            if (this.canLog(LOGGINGLEVEL.ERROR) && this.showMessages === true) {
                console.error('(ERROR) ' + this.messageConstruction(msg));
                if(error) console.error(error);
            }
        }
    }

    /**
     * Logging a fatal error.
     * @param msg the message
     */
    public fatal(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.FATAL) && this.showMessages === true)
            console.error('(FATAL) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an info.
     * @param msg the message
     */
    public info(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
            console.info('(INFO) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a warning.
     * @param msg the message
     */
    public warn(msg: string): void {
        if (this.canLog(LOGGINGLEVEL.WARN) && this.showMessages === true)
            console.warn('(WARN) ' + this.messageConstruction(msg));
    }

    // #endregion Public Methods (8)

    // #region Private Methods (2)

    /**
     * Logging an error.
     * @param msg the message
     */
    private httpError(msg: string, error: Error, httpError: number): void {
        if (httpError.toString()[0] === '1') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 100:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Continue. ' + error.message);
                        break;
                    case 101:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Switching Protocols. ' + error.message);
                        break;
                    case 102:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Processing. ' + error.message);
                        break;
                    case 103:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Early Hints. ' + error.message);
                        break;
                    default:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Informational Response. ' + error.message);
                }
        } else if (httpError.toString()[0] === '2') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 200:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': OK. ' + error.message);
                        break;
                    case 201:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Created. ' + error.message);
                        break;
                    case 202:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Accepted. ' + error.message);
                        break;
                    case 203:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Non-Authoritative Information. ' + error.message);
                        break;
                    case 204:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': No Content. ' + error.message);
                        break;
                    case 205:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Reset Content. ' + error.message);
                        break;
                    case 206:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Partial Content. ' + error.message);
                        break;
                    case 207:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Multi-Status. ' + error.message);
                        break;
                    case 208:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Already Reported. ' + error.message);
                        break;
                    case 226:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': IM Used. ' + error.message);
                        break;
                    default:
                        this.info(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Success Message. ' + error.message);
                }
        } else if (httpError.toString()[0] === '3') {
            if (this.canLog(LOGGINGLEVEL.WARN) && this.showMessages === true)
                switch (httpError) {
                    case 300:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Multiple Choices. ' + error.message);
                        break;
                    case 301:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Moved Permanently. ' + error.message);
                        break;
                    case 302:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Found (Previously "Moved temporarily"). ' + error.message);
                        break;
                    case 303:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': See Other. ' + error.message);
                        break;
                    case 304:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Not Modified. ' + error.message);
                        break;
                    case 305:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Use Proxy. ' + error.message);
                        break;
                    case 306:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Switch Proxy. ' + error.message);
                        break;
                    case 307:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Temporary Redirect. ' + error.message);
                        break;
                    case 308:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Permanent Redirect. ' + error.message);
                        break;
                    default:
                        this.warn(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Redirection Error. ' + error.message);
                }
        } else if (httpError.toString()[0] === '4') {
            if (this.canLog(LOGGINGLEVEL.ERROR) && this.showMessages === true)
                switch (httpError) {
                    case 400:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Bad Request. ' + error.message);
                        break;
                    case 401:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unauthorized. ' + error.message);
                        break;
                    case 402:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Payment Required. ' + error.message);
                        break;
                    case 403:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Forbidden. ' + error.message);
                        break;
                    case 404:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Not Found. ' + error.message);
                        break;
                    case 405:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Method Not Allowed. ' + error.message);
                        break;
                    case 406:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Not Acceptable. ' + error.message);
                        break;
                    case 407:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Proxy Authentication Required. ' + error.message);
                        break;
                    case 408:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Request Timeout. ' + error.message);
                        break;
                    case 409:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Conflict. ' + error.message);
                        break;
                    case 410:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Gone. ' + error.message);
                        break;
                    case 411:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Length Required. ' + error.message);
                        break;
                    case 412:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Precondition Failed. ' + error.message);
                        break;
                    case 413:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Payload Too Large. ' + error.message);
                        break;
                    case 414:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': URI Too Long. ' + error.message);
                        break;
                    case 415:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unsupported Media Type. ' + error.message);
                        break;
                    case 416:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Range Not Satisfiable. ' + error.message);
                        break;
                    case 417:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Expectation Failed. ' + error.message);
                        break;
                    case 421:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Misdirected Request. ' + error.message);
                        break;
                    case 422:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unprocessable Entity. ' + error.message);
                        break;
                    case 423:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Locked. ' + error.message);
                        break;
                    case 424:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Failed Dependency. ' + error.message);
                        break;
                    case 425:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Too Early. ' + error.message);
                        break;
                    case 426:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Upgrade Required. ' + error.message);
                        break;
                    case 428:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Precondition Required. ' + error.message);
                        break;
                    case 429:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Too Many Requests. ' + error.message);
                        break;
                    case 431:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Request Header Fields Too Large. ' + error.message);
                        break;
                    case 451:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unavailable For Legal Reasons. ' + error.message);
                        break;
                    case 418:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': I\'m a teapot. ' + error.message);
                        break;
                    case 420:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Policy Not Fulfilled. ' + error.message);
                        break;
                    case 444:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': No Response. ' + error.message);
                        break;
                    case 449:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': The request should be retried after doing the appropriate action. ' + error.message);
                        break;
                    case 499:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Client Closed Request. ' + error.message);
                        break;
                    default:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Client Error. ' + error.message);
                }
        } else if (httpError.toString()[0] === '5') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 500:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Internal Server Error. ' + error.message);
                        break;
                    case 501:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Not Implemented. ' + error.message);
                        break;
                    case 502:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Bad Gateway. ' + error.message);
                        break;
                    case 503:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Service Unavailable. ' + error.message);
                        break;
                    case 504:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Gateway Timeout. ' + error.message);
                        break;
                    case 505:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': HTTP Version Not Supported. ' + error.message);
                        break;
                    case 506:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Variant Also Negotiates. ' + error.message);
                        break;
                    case 507:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Insufficient Storage. ' + error.message);
                        break;
                    case 508:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Loop Detected. ' + error.message);
                        break;
                    case 510:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Not Extended. ' + error.message);
                        break;
                    case 511:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Network Authentication Required. ' + error.message);
                        break;
                    default:
                        this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Server Error. ' + error.message);
                }
        } else {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                this.error(msg + '\n' + 'Http-Code ' + httpError + ': Unknown Error Code. ' + error.message);
        }
    }

    private messageConstruction(msg: string): string {
        return new Date().toISOString() + ': ' + msg;
    }

    // #endregion Private Methods (2)
}