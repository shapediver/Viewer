export class SDError extends Error {
    
    public originalError: Error;
    
    constructor(msg: string, error?: any) {
        super(msg);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SDError);
        }

        this.originalError = error;
        Object.setPrototypeOf(this, SDError.prototype);
    }
}