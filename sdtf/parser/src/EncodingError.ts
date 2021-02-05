/**
 * Error for the encoding package.
 */
export class EncodingError extends Error {
    constructor(m: string, private readonly _fullError?: Error) {
        super(m);
        Object.setPrototypeOf(this, EncodingError.prototype);
    }

    public get fullError(): Error | undefined {
        return this._fullError;
    }
}