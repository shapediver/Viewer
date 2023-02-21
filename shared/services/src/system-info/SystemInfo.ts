import UAParser from 'ua-parser-js';

export class SystemInfo {
    // #region Properties (5)

    private readonly _isBrowser: boolean;
    private readonly _isIframe: boolean;
    private readonly _origin: string;
    private readonly _parser: UAParser;

    private static _instance: SystemInfo;

    // #endregion Properties (5)

    // #region Constructors (1)

    private constructor() {
        this._parser = new UAParser();
        const isInternetExplorer = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.indexOf('Trident') > -1;
        this._isBrowser = isInternetExplorer ||
            (typeof document !== 'undefined'
                && typeof document.getElementById === 'function'
                && window
                && typeof window.Event === 'function'
            );
        this._isIframe = false;
        if (this._isBrowser) {
            // in case we are running in an iframe, parent and window are different, in
            // that case we use the referrer
            this._isIframe = parent !== window;
            this._origin = this._isIframe ? document.referrer : window.location.origin;
        } else {
            this._origin = 'direct';
        }
    }

    // #endregion Constructors (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Accessors (11)

    /**
     * Check if we are on an Android device
     */
    public get isAndroid(): boolean {
        const osName = this._parser.getOS().name;
        return osName === 'Android';
    }

    /**
     * Check if we are running in a browser
     */
    public get isBrowser(): boolean {
        return this._isBrowser;
    }

    /**
     * Check if we are running in Safari
     */
    public get isChrome(): boolean {
        const browserName = this._parser.getBrowser().name;
        return !!(browserName && browserName.includes('Chrome'));
    }

    /**
     * Check if we are running in Firefox
     */
    public get isFirefox(): boolean {
        const browserName = this._parser.getBrowser().name;
        return !!(browserName && browserName.includes('Firefox'));
    }

    /**
     * Check if we are running in internet explorer (arrrggghhhh!!!!)
     */
    public get isIE(): boolean {
        const browserName = this._parser.getBrowser().name;
        return !!(browserName && browserName.includes('IE'));
    }

    /**
     * Check if we are on an IOS device
     */
    public get isIOS(): boolean {
        const osName = this._parser.getOS().name;
        return osName === 'iOS' || 
        (window.navigator && window.navigator.maxTouchPoints === 5 && window.navigator.platform === 'MacIntel');
    }

    /**
     * Check if we are running in an iframe
     */
    public get isIframe(): boolean {
        return this._isIframe;
    }

    /**
     * Check if we are on a Mac OS device
     */
    public get isMacOS(): boolean {
        const osName = this._parser.getOS().name;
        return osName === 'Mac OS';
    }

    /**
     * Check if we are on a mobile device
     */
    public get isMobile(): boolean {
        const type = this._parser.getDevice().type;
        return type === 'mobile' || type === 'tablet';
    }

    /**
     * Check if we are running in Safari
     */
    public get isSafari(): boolean {
        const browserName = this._parser.getBrowser().name;
        return !!(browserName && browserName.includes('Safari'));
    }

    /**
     * Get guessed origin of embedding website
     */
    public get origin(): string {
        return this._origin + '';
    }

    // #endregion Public Accessors (11)
}