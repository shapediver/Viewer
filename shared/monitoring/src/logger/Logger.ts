import { singleton } from "tsyringe";

@singleton()
export class Logger {

    private messageConstruction(msg: string): string {
        return new Date().toISOString() + ': ' + msg;
    }

    /**
     * Logging a fatal error.
     * @param msg the message
     */
    public fatal(msg: string): void {
        console.error('(FATAL) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an error.
     * @param msg the message
     */
    public error(msg: string): void {
        console.error('(ERROR) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a warning.
     * @param msg the message
     */
    public warn(msg: string): void {
        console.warn('(WARN) ' + this.messageConstruction(msg));
    }

    /**
     * Logging an info.
     * @param msg the message
     */
    public info(msg: string): void {
        console.info('(INFO) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message.
     * @param msg the message
     */
    public debug(msg: string): void {
        console.debug('(DEBUG) ' + this.messageConstruction(msg));
    }

    /**
     * Logging a debug message with low priority.
     * @param msg the message
     */
    public debugLow(msg: string): void {
        console.debug('(DEBUG_LOW) ' + this.messageConstruction(msg));    
    }

    /**
     * Logging a debug message with medium priority.
     * @param msg the message
     */
    public debugMedium(msg: string): void {
        console.debug('(DEBUG_MEDIUM) ' + this.messageConstruction(msg));    
    }

    /**
     * Logging a debug message with high priority.
     * @param msg the message
     */
    public debugHigh(msg: string): void {
        console.debug('(DEBUG_HIGH) ' + this.messageConstruction(msg));    
    }
}