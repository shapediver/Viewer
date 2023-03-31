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

export class Logger {
    // #region Properties (8)

    private static _instance: Logger;

    private _loggingLevel: LOGGING_LEVEL = LOGGING_LEVEL.WARN;
    private _showMessages: boolean = true;

    // #endregion Properties (8)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

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

    // #endregion Public Accessors (4)

    // #region Public Methods (11)

    /**
     * Logging a debug message.
     * @param msg the message
     */
    public debug(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG) && this.showMessages === true)
            console.debug('(DEBUG) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with high priority.
     * @param msg the message
     */
    public debugHigh(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_HIGH) && this.showMessages === true)
            console.debug('(DEBUG_HIGH) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with low priority.
     * @param msg the message
     */
    public debugLow(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_LOW) && this.showMessages === true)
            console.debug('(DEBUG_LOW) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with medium priority.
     * @param msg the message
     */
    public debugMedium(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.DEBUG_MEDIUM) && this.showMessages === true)
            console.debug('(DEBUG_MEDIUM) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public error(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.ERROR) && this.showMessages === true) 
            console.error('(ERROR) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a fatal error.
     * @param msg the message
     */
    public fatal(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.FATAL) && this.showMessages === true)
            console.error('(FATAL) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an info.
     * @param msg the message
     */
    public info(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.INFO) && this.showMessages === true)
            console.info('(INFO) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a warning.
     * @param msg the message
     */
    public warn(msg: string): void {
        if (this.canLog(LOGGING_LEVEL.WARN) && this.showMessages === true)
            console.warn('(WARN) ' + this.messageConstruction(msg));
    }

    // #endregion Public Methods (11)

    // #region Private Methods (2)

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

    private messageConstruction(msg: string): string {
        return new Date().toISOString() + ': ' + msg;
    }

    // #endregion Private Methods (2)
}