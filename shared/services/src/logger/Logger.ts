import * as Sentry from '@sentry/browser'
import { container, singleton } from 'tsyringe'
import { Integrations } from '@sentry/tracing'
import { build_data } from '@shapediver/viewer.shared.build-data'

import { UuidGenerator } from '../uuid-generator/UuidGenerator'
import { SDError } from './SDError'
import { GlobalHandlers } from '@sentry/browser/dist/integrations'
import { BrowserClient, Hub } from '@sentry/browser'

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

export enum LOGGINGTOPIC {
    AR = 'ar',
    GENERAL = 'general',
    EXPORT = 'export',
    PARAMETER = 'parameter',
    OUTPUT = 'output',
    SESSION = 'session',
    VIEWER = 'viewer',
    CAMERA = 'camera',
    LIGHT = 'light',
    CAMERACONTROL = 'cameracontrol',
    DATAPROCESSING = 'dataprocessing',
    SDTF = 'sdtf',
    THREE = 'three',
}

@singleton()
export class Logger {
    // #region Properties (2)

    private _loggingLevel: LOGGINGLEVEL = LOGGINGLEVEL.WARN;
    private _showMessages: boolean = true;
    private _breadCrumbs: Sentry.Breadcrumb[] = [];
    private _breadCrumbCounter: number = 0;
    private _sentryHub: Hub;
    private _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private _userId = this._uuidGenerator.create();

    // #endregion Properties (2)

    constructor() {
        

        // THREE.JS is stupid and logs millions of errors, warnings, etc. this is how we avoid them
        const oldConsoleDebug = console.debug;
        console.debug = (...data) => {
            if(data && Array.isArray(data) && typeof data[0] === 'string' && data[0].startsWith('THREE')) return;
            oldConsoleDebug(...data);
        };

        const oldConsoleInfo = console.info;
        console.info = (...data) => {
            if(data && Array.isArray(data) && typeof data[0] === 'string' && data[0].startsWith('THREE')) return;
            oldConsoleInfo(...data);
        };

        const oldConsoleLog = console.log;
        console.log = (...data) => {
            if(data && Array.isArray(data) && typeof data[0] === 'string' && data[0].startsWith('THREE')) return;
            oldConsoleLog(...data);
        };

        const oldConsoleWarn = console.warn;
        console.warn = (...data) => {
            if(data && Array.isArray(data) && typeof data[0] === 'string' && data[0].startsWith('THREE')) return;
            oldConsoleWarn(...data);
        };

        const oldConsoleError = console.error;
        console.error = (...data) => {
            if(data && Array.isArray(data) && typeof data[0] === 'string' && data[0].startsWith('THREE')) {
                this.error(LOGGINGTOPIC.THREE, new SDError(data[0]), data[0])
                return;
            };
            oldConsoleError(...data);
        };

        const client = new BrowserClient({
            dsn: "https://0510990697b04b9da3ad07868e94e378@o363881.ingest.sentry.io/5828729",
            environment: 'local',
            release: build_data.build_version,
            maxBreadcrumbs: 100,
            beforeBreadcrumb: (breadcrumb: Sentry.Breadcrumb, hint?: Sentry.BreadcrumbHint | undefined): Sentry.Breadcrumb | null => {
                this._breadCrumbCounter++;
                return breadcrumb;
            },
            beforeSend: (event: Sentry.Event, hint?: Sentry.EventHint | undefined): Sentry.Event | PromiseLike<Sentry.Event | null> | null => {
                if (event.level === Sentry.Severity.Debug) event.fingerprint ? event.fingerprint.push(this._userId + '') : event.fingerprint = [this._userId + ''];
                return event;
            },
            // Set tracesSampleRate to 1.0 to capture 100%
            // of transactions for performance monitoring.
            // We recommend adjusting this value in production
            tracesSampleRate: 1.0
        });

        this._sentryHub = new Hub(client);

        this._sentryHub.setUser({
            id: this._userId
        })
    }

    // #region Public Accessors (4)

    public get loggingLevel(): LOGGINGLEVEL {
        return this._loggingLevel;
    }

    public set loggingLevel(value: LOGGINGLEVEL) {
        this._loggingLevel = value;
    }

    public get showMessages(): boolean {
        return this._showMessages;
    }

    public set showMessages(value: boolean) {
        this._showMessages = value;
    }

    private canLog(loggingLevel: LOGGINGLEVEL): boolean {
        switch (this.loggingLevel) {
            case LOGGINGLEVEL.ERROR:
                if (loggingLevel === LOGGINGLEVEL.FATAL) return false;
                if (loggingLevel === LOGGINGLEVEL.WARN) return false;
                if (loggingLevel === LOGGINGLEVEL.INFO) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.FATAL:
                if (loggingLevel === LOGGINGLEVEL.WARN) return false;
                if (loggingLevel === LOGGINGLEVEL.INFO) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.WARN:
                if (loggingLevel === LOGGINGLEVEL.INFO) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.INFO:
                if (loggingLevel === LOGGINGLEVEL.DEBUG) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_HIGH:
                if (loggingLevel === LOGGINGLEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_MEDIUM:
                if (loggingLevel === LOGGINGLEVEL.DEBUG_LOW) return false;
            case LOGGINGLEVEL.DEBUG_LOW:
            case LOGGINGLEVEL.DEBUG:
            default:
                return true;
        }
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (8)

    private sentryError(topic: LOGGINGTOPIC, error: Error, msg?: string) {
        this.sentryBreadcrumb(topic, msg || error.message, Sentry.Severity.Error); 

        const breadcrumbCounter = this._breadCrumbCounter > 100 ? 100 : this._breadCrumbCounter;
        for(let i = breadcrumbCounter; i < this._breadCrumbs.length + breadcrumbCounter; i++) {
            if(i%100 === 0 && i !== 0) {
                this._sentryHub.setTag('topic', topic);
                this._sentryHub.setUser({ id: this._userId })
                this._sentryHub.captureMessage('Breadcrumb Issue ' + (i/100 - 1) + ' (' + this._userId + ')', Sentry.Severity.Debug);
                this._sentryHub.getScope()?.clear()
            }
            this._sentryHub.addBreadcrumb(this._breadCrumbs[i-breadcrumbCounter]);
        }

        this._sentryHub.setTag('topic', topic);
        this._sentryHub.setUser({ id: this._userId })
        this._sentryHub.captureException(error);
    }

    private sentryBreadcrumb(topic: LOGGINGTOPIC, msg: string, level: Sentry.Severity) {
        this._breadCrumbs.push({
            category: topic,
            message: msg,
            level: Sentry.Severity.Debug,
            timestamp: Math.floor(new Date().getTime() / 1000)
        })
    }

    /**
     * Logging a debug message.
     * @param msg the message
     */
    public debug(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Debug);
        if (this.canLog(LOGGINGLEVEL.DEBUG) && this.showMessages === true)
            console.debug('(DEBUG) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with high priority.
     * @param msg the message
     */
    public debugHigh(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Debug);
        if (this.canLog(LOGGINGLEVEL.DEBUG_HIGH) && this.showMessages === true)
            console.debug('(DEBUG_HIGH) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with low priority.
     * @param msg the message
     */
    public debugLow(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Debug);
        if (this.canLog(LOGGINGLEVEL.DEBUG_LOW) && this.showMessages === true)
            console.debug('(DEBUG_LOW) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with medium priority.
     * @param msg the message
     */
    public debugMedium(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Debug);
        if (this.canLog(LOGGINGLEVEL.DEBUG_MEDIUM) && this.showMessages === true)
            console.debug('(DEBUG_MEDIUM) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public error(topic: LOGGINGTOPIC, error: Error, msg?: string, throwError: boolean = false, notifySentry: boolean = true): void {
        this.sentryBreadcrumb(topic, msg || error.message, Sentry.Severity.Error); 
        if(notifySentry) 
            this.sentryError(topic, error, msg);
        if (this.canLog(LOGGINGLEVEL.ERROR) && this.showMessages === true) 
            console.error('(ERROR) ' + this.messageConstruction(msg || error.message));
        if(throwError) throw error;
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public httpError(topic: LOGGINGTOPIC, error: Error, msg: string, httpError: number, throwError: boolean = false): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Error);
        this.httpErrorHelper(topic, msg, error, httpError, throwError, false);
    }

    /**
     * Logging a fatal error.
     * @param msg the message
     */
    public fatal(topic: LOGGINGTOPIC, msg: string, error: Error, throwError: boolean = false): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Fatal);
        this.sentryError(topic, error, msg);
        if (this.canLog(LOGGINGLEVEL.FATAL) && this.showMessages === true)
            console.error('(FATAL) ' + this.messageConstruction(msg));
        if(throwError) throw error;
    }

    /**
     * Logging an info.
     * @param msg the message
     */
    public info(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Info);
        if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
            console.info('(INFO) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a warning.
     * @param msg the message
     */
    public warn(topic: LOGGINGTOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Warning);
        if (this.canLog(LOGGINGLEVEL.WARN) && this.showMessages === true)
            console.warn('(WARN) ' + this.messageConstruction(msg));
    }

    // #endregion Public Methods (8)

    // #region Private Methods (2)

    /**
     * Logging an error.
     * @param msg the message
     */
    private httpErrorHelper(topic: LOGGINGTOPIC, msg: string, error: Error, httpError: number, throwError: boolean = false, notifySentry: boolean = false): void {
        if (httpError.toString()[0] === '1') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 100:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Continue. ' + error.message);
                        break;
                    case 101:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Switching Protocols. ' + error.message);
                        break;
                    case 102:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Processing. ' + error.message);
                        break;
                    case 103:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Early Hints. ' + error.message);
                        break;
                    default:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Informational Response. ' + error.message);
                }
        } else if (httpError.toString()[0] === '2') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 200:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': OK. ' + error.message);
                        break;
                    case 201:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Created. ' + error.message);
                        break;
                    case 202:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Accepted. ' + error.message);
                        break;
                    case 203:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Non-Authoritative Information. ' + error.message);
                        break;
                    case 204:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': No Content. ' + error.message);
                        break;
                    case 205:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Reset Content. ' + error.message);
                        break;
                    case 206:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Partial Content. ' + error.message);
                        break;
                    case 207:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Multi-Status. ' + error.message);
                        break;
                    case 208:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Already Reported. ' + error.message);
                        break;
                    case 226:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': IM Used. ' + error.message);
                        break;
                    default:
                        this.info(topic, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Success Message. ' + error.message);
                }
        } else if (httpError.toString()[0] === '3') {
            if (this.canLog(LOGGINGLEVEL.WARN) && this.showMessages === true)
                switch (httpError) {
                    case 300:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Multiple Choices. ' + error.message);
                        break;
                    case 301:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Moved Permanently. ' + error.message);
                        break;
                    case 302:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Found (Previously "Moved temporarily"). ' + error.message);
                        break;
                    case 303:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': See Other. ' + error.message);
                        break;
                    case 304:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Not Modified. ' + error.message);
                        break;
                    case 305:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Use Proxy. ' + error.message);
                        break;
                    case 306:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Switch Proxy. ' + error.message);
                        break;
                    case 307:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Temporary Redirect. ' + error.message);
                        break;
                    case 308:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Permanent Redirect. ' + error.message);
                        break;
                    default:
                        this.warn(topic, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Redirection Error. ' + error.message);
                }
        } else if (httpError.toString()[0] === '4') {
            if (this.canLog(LOGGINGLEVEL.ERROR) && this.showMessages === true)
                switch (httpError) {
                    case 400:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Bad Request. ' + error.message, throwError, notifySentry);
                        break;
                    case 401:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unauthorized. ' + error.message, throwError, notifySentry);
                        break;
                    case 402:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Payment Required. ' + error.message, throwError, notifySentry);
                        break;
                    case 403:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Forbidden. ' + error.message, throwError, notifySentry);
                        break;
                    case 404:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Not Found. ' + error.message, throwError, notifySentry);
                        break;
                    case 405:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Method Not Allowed. ' + error.message, throwError, notifySentry);
                        break;
                    case 406:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Not Acceptable. ' + error.message, throwError, notifySentry);
                        break;
                    case 407:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Proxy Authentication Required. ' + error.message, throwError, notifySentry);
                        break;
                    case 408:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Request Timeout. ' + error.message, throwError, notifySentry);
                        break;
                    case 409:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Conflict. ' + error.message, throwError, notifySentry);
                        break;
                    case 410:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Gone. ' + error.message, throwError, notifySentry);
                        break;
                    case 411:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Length Required. ' + error.message, throwError, notifySentry);
                        break;
                    case 412:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Precondition Failed. ' + error.message, throwError, notifySentry);
                        break;
                    case 413:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Payload Too Large. ' + error.message, throwError, notifySentry);
                        break;
                    case 414:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': URI Too Long. ' + error.message, throwError, notifySentry);
                        break;
                    case 415:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unsupported Media Type. ' + error.message, throwError, notifySentry);
                        break;
                    case 416:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Range Not Satisfiable. ' + error.message, throwError, notifySentry);
                        break;
                    case 417:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Expectation Failed. ' + error.message, throwError, notifySentry);
                        break;
                    case 421:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Misdirected Request. ' + error.message, throwError, notifySentry);
                        break;
                    case 422:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unprocessable Entity. ' + error.message, throwError, notifySentry);
                        break;
                    case 423:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Locked. ' + error.message, throwError, notifySentry);
                        break;
                    case 424:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Failed Dependency. ' + error.message, throwError, notifySentry);
                        break;
                    case 425:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Too Early. ' + error.message, throwError, notifySentry);
                        break;
                    case 426:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Upgrade Required. ' + error.message, throwError, notifySentry);
                        break;
                    case 428:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Precondition Required. ' + error.message, throwError, notifySentry);
                        break;
                    case 429:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Too Many Requests. ' + error.message, throwError, notifySentry);
                        break;
                    case 431:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Request Header Fields Too Large. ' + error.message, throwError, notifySentry);
                        break;
                    case 451:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unavailable For Legal Reasons. ' + error.message, throwError, notifySentry);
                        break;
                    case 418:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': I\'m a teapot. ' + error.message, throwError, notifySentry);
                        break;
                    case 420:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Policy Not Fulfilled. ' + error.message, throwError, notifySentry);
                        break;
                    case 444:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': No Response. ' + error.message, throwError, notifySentry);
                        break;
                    case 449:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': The request should be retried after doing the appropriate action. ' + error.message, throwError, notifySentry);
                        break;
                    case 499:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Client Closed Request. ' + error.message, throwError, notifySentry);
                        break;
                    default:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Client Error. ' + error.message, throwError, notifySentry);
                }
        } else if (httpError.toString()[0] === '5') {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                switch (httpError) {
                    case 500:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Internal Server Error. ' + error.message, throwError, notifySentry);
                        break;
                    case 501:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Not Implemented. ' + error.message, throwError, notifySentry);
                        break;
                    case 502:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Bad Gateway. ' + error.message, throwError, notifySentry);
                        break;
                    case 503:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Service Unavailable. ' + error.message, throwError, notifySentry);
                        break;
                    case 504:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Gateway Timeout. ' + error.message, throwError, notifySentry);
                        break;
                    case 505:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': HTTP Version Not Supported. ' + error.message, throwError, notifySentry);
                        break;
                    case 506:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Variant Also Negotiates. ' + error.message, throwError, notifySentry);
                        break;
                    case 507:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Insufficient Storage. ' + error.message, throwError, notifySentry);
                        break;
                    case 508:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Loop Detected. ' + error.message, throwError, notifySentry);
                        break;
                    case 510:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Not Extended. ' + error.message, throwError, notifySentry);
                        break;
                    case 511:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Network Authentication Required. ' + error.message, throwError, notifySentry);
                        break;
                    default:
                        this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Server Error. ' + error.message, throwError, notifySentry);
                }
        } else {
            if (this.canLog(LOGGINGLEVEL.INFO) && this.showMessages === true)
                this.error(topic, error, msg + '\n' + 'Http-Code ' + httpError + ': Unknown Error Code. ' + error.message, throwError, notifySentry);
        }
    }

    private messageConstruction(msg: string): string {
        return new Date().toISOString() + ': ' + msg;
    }

    // #endregion Private Methods (2)
}