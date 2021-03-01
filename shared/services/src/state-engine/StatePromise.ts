export class StatePromise<T> {
    private _resolved: boolean = false;
    private _resolve!: (value: T | PromiseLike<T>) => void;
    private _reject!: (value: T | PromiseLike<T>) => void;

    private _promise: Promise<T>;

    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        
        this._promise.finally(() => {
            this._resolved = true;
        });
    }

    public get resolved(): boolean {
        return this._resolved;
    }

    public get resolve(): (value: T | PromiseLike<T>) => void {
        return this._resolve;
    }

    public get reject(): (value: T | PromiseLike<T>) => void {
        return this._reject;
    }

    public async then(callback: () => void ) {
        this.resolved === true ? callback() : this._promise.then(callback);
    }
}