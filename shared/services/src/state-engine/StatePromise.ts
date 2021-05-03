export class StatePromise<T> {
    private _resolved: boolean = false;
    private _resolve!: (value: T | PromiseLike<T>) => void;
    private _reject!: (value: T | PromiseLike<T>) => void;

    private _promise: Promise<T>;
    private _callbacks: (() => void)[] = [];

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
        this._callbacks.push(callback);
        this.resolved === true ? callback() : this._promise.then(callback);
    }

    public reset() {
        this._resolved = false;
        
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        
        this._promise.finally(() => {
            this._resolved = true;
        });

        const callbackCopy = [...this._callbacks];
        this._callbacks = [];
        for(let i = 0; i < callbackCopy.length; i++)
            this.then(callbackCopy[i])
    }
}