import * as Sentry from '@sentry/browser'
import { container, singleton } from 'tsyringe'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { ShapeDiverError as ShapeDiverBackendError } from '@shapediver/sdk.geometry-api-sdk-core'

import { UuidGenerator } from '../uuid-generator/UuidGenerator'
import { BrowserClient, Hub } from '@sentry/browser'
import { ShapeDiverViewerConnectionError, ShapeDiverViewerUnknownError } from './ShapeDiverViewerErrors'
import { ShapeDiverRequestError, ShapeDiverResponseError, ShapeDiverResponseErrorType } from '@shapediver/sdk.geometry-api-sdk-v2'
import { ShapeDiverViewerError } from './ShapeDiverError'

export enum LOGGING_LEVEL {
    NONE = 'none',
    ERROR = 'error',
    FATAL = 'fatal',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    DEBUG_HIGH = 'debug_high',
    DEBUG_MEDIUM = 'debug_medium',
    DEBUG_LOW = 'debug_low',
}

export enum LOGGING_TOPIC {
    AR = 'ar',
    GENERAL = 'general',
    EXPORT = 'export',
    PARAMETER = 'parameter',
    OUTPUT = 'output',
    SESSION = 'session',
    VIEWPORT = 'viewer',
    CAMERA = 'camera',
    LIGHT = 'light',
    CAMERA_CONTROL = 'camera_control',
    DATA_PROCESSING = 'data_processing',
    SDTF = 'sdtf',
    THREE = 'three',
    SETTINGS = 'settings',
}

@singleton()
export class Logger {
    // #region Properties (2)

    private _loggingLevel: LOGGING_LEVEL = LOGGING_LEVEL.WARN;
    private _showMessages: boolean = true;
    private _breadCrumbs: Sentry.Breadcrumb[] = [];
    private _breadCrumbCounter: number = 0;
    private _sentryHub: Hub;
    private _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private _userId = this._uuidGenerator.create();

    // #endregion Properties (2)

    constructor() {
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

    public get loggingLevel(): LOGGING_LEVEL {
        return this._loggingLevel;
    }

    public set loggingLevel(value: LOGGING_LEVEL) {
        this._loggingLevel = value;
    }

    public get showMessages(): boolean {
        return this._showMessages;
    }

    public set showMessages(value: boolean) {
        this._showMessages = value;
    }

    private canLog(loggingLevel: LOGGING_LEVEL): boolean {
        switch (this.loggingLevel) {
            case LOGGING_LEVEL.ERROR:
                if (loggingLevel === LOGGING_LEVEL.FATAL) return false;
                if (loggingLevel === LOGGING_LEVEL.WARN) return false;
                if (loggingLevel === LOGGING_LEVEL.INFO) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.FATAL:
                if (loggingLevel === LOGGING_LEVEL.WARN) return false;
                if (loggingLevel === LOGGING_LEVEL.INFO) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.WARN:
                if (loggingLevel === LOGGING_LEVEL.INFO) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.INFO:
                if (loggingLevel === LOGGING_LEVEL.DEBUG) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_HIGH) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.DEBUG_HIGH:
                if (loggingLevel === LOGGING_LEVEL.DEBUG_MEDIUM) return false;
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.DEBUG_MEDIUM:
                if (loggingLevel === LOGGING_LEVEL.DEBUG_LOW) return false;
            case LOGGING_LEVEL.DEBUG_LOW:
            case LOGGING_LEVEL.DEBUG:
            default:
                return true;
        }
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (8)
    
    public handleError(topic: LOGGING_TOPIC, scope: string, e: ShapeDiverBackendError | ShapeDiverViewerError | Error | unknown, logToSentry = true) {
        if (this.canLog(LOGGING_LEVEL.ERROR) && this.showMessages === true) 
            //console.error('(ERROR) ', e);
        if(e instanceof ShapeDiverRequestError) {
            const messageProperty = e && e.message ? e.message : `An unknown issue occurred in ${scope}.`;
            if(logToSentry) this.sentryError(topic, e, messageProperty);
            throw e;
        } else if(e instanceof ShapeDiverResponseError && e.error === ShapeDiverResponseErrorType.UNKNOWN) {
            const messageProperty = e && e.message ? e.message : `An unknown issue occurred in ${scope}.`;
            if(logToSentry) this.sentryError(topic, e, messageProperty);
            throw e;
        } else if(e instanceof ShapeDiverResponseError) {
            throw e;
        } else if (e instanceof ShapeDiverViewerError) {
            const messageProperty = e && e.message ? e.message : `An unknown issue occurred in ${scope}.`;
            if(logToSentry) {
                if(!(e instanceof ShapeDiverViewerConnectionError) || (e.status && e.status >= 500)) {
                    this.sentryError(topic, e, messageProperty);
                }
            }
            throw e;
        } else if(e) {
            const error = <any>e;
            const messageProperty = error.message ? error.message : `An unknown issue occurred in ${scope}.`;
            const viewerError = new ShapeDiverViewerUnknownError(messageProperty, error);
            if(logToSentry) this.sentryError(topic, viewerError, messageProperty);
            throw viewerError;
        }
    }

    public sentryError(topic: LOGGING_TOPIC, error: ShapeDiverBackendError | ShapeDiverViewerError | Error, msg?: string) {
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
        
        if(error instanceof ShapeDiverBackendError || error instanceof ShapeDiverViewerError) {
            this._sentryHub.captureMessage(error.message, Sentry.Severity.Error);
        } else {            
            this._sentryHub.captureException(error);
        }
    }

    public sentryBreadcrumb(topic: LOGGING_TOPIC, msg: string, level: Sentry.Severity) {
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
    public debug(topic: LOGGING_TOPIC, msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG) && this.showMessages === true)
            console.debug('(DEBUG) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with high priority.
     * @param msg the message
     */
    public debugHigh(topic: LOGGING_TOPIC, msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_HIGH) && this.showMessages === true)
            console.debug('(DEBUG_HIGH) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with low priority.
     * @param msg the message
     */
    public debugLow(topic: LOGGING_TOPIC, msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_LOW) && this.showMessages === true)
            console.debug('(DEBUG_LOW) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with medium priority.
     * @param msg the message
     */
    public debugMedium(topic: LOGGING_TOPIC, msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_MEDIUM) && this.showMessages === true)
            console.debug('(DEBUG_MEDIUM) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public error(topic: LOGGING_TOPIC, error: Error, msg?: string, throwError: boolean = false, notifySentry: boolean = true): void {
        this.sentryBreadcrumb(topic, msg || error.message, Sentry.Severity.Error); 
        if(notifySentry) 
            this.sentryError(topic, error, msg);
        if (this.canLog(LOGGING_LEVEL.ERROR) && this.showMessages === true) 
            console.error('(ERROR) ' + this.messageConstruction(msg || error.message));
        if(throwError) throw error;
    }

    /**
     * Logging a fatal error.
     * @param msg the message
     */
    public fatal(topic: LOGGING_TOPIC, msg: string, error: Error, throwError: boolean = false): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Fatal);
        this.sentryError(topic, error, msg);
        if (this.canLog(LOGGING_LEVEL.FATAL) && this.showMessages === true)
            console.error('(FATAL) ' + this.messageConstruction(msg));
        if(throwError) throw error;
    }

    /**
     * Logging an info.
     * @param msg the message
     */
    public info(topic: LOGGING_TOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Info);
        if (this.canLog(LOGGING_LEVEL.INFO) && this.showMessages === true)
            console.info('(INFO) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a warning.
     * @param msg the message
     */
    public warn(topic: LOGGING_TOPIC, msg: string): void {
        this.sentryBreadcrumb(topic, msg, Sentry.Severity.Warning);
        if (this.canLog(LOGGING_LEVEL.WARN) && this.showMessages === true)
            console.warn('(WARN) ' + this.messageConstruction(msg));
    }

    // #endregion Public Methods (8)

    // #region Private Methods (2)

    private messageConstruction(msg: string): string {
        return new Date().toISOString() + ': ' + msg;
    }

    // #endregion Private Methods (2)
}