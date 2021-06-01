import { singleton } from "tsyringe";

@singleton()
export class SystemInfo {

    private readonly _runningInInternetExplorer: boolean;
    private readonly _runningInBrowser: boolean;
    private readonly _runningInIframe: boolean;
    private readonly _origin: string;

    constructor() {
        this._runningInInternetExplorer = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.indexOf('Trident') > -1;
        this._runningInBrowser = this._runningInInternetExplorer ||
            (typeof document !== 'undefined'
                && typeof document.getElementById === 'function'
                && window
                && typeof window.Event === 'function'
            );
        this._runningInIframe = false;
        if (this._runningInBrowser) {
            // in case we are running in an iframe, parent and window are different, in
            // that case we use the referrer
            this._runningInIframe = parent !== window;
            this._origin = this._runningInIframe ? document.referrer : window.location.origin;
        } else {
            this._origin = 'direct';
        }
    }

    /**
     * Check if we are running in internet explorer (arrrggghhhh!!!!)
     */
    public get runningInInternetExplorer(): boolean {
        return this._runningInInternetExplorer;
    };

    /**
     * Check if we are running in a browser
     */
    public get runningInBrowser(): boolean {
        return this._runningInBrowser;
    };

    /**
     * Check if we are running in an iframe
     */
    public get runningInIframe(): boolean {
        return this._runningInIframe;
    };

    /**
     * Get guessed origin of embedding website
     */
    public get origin(): string {
        return this._origin + '';
    };
}