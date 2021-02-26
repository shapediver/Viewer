
let runningInIE = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.indexOf('Trident') > -1;
let runningInB = runningInIE ||
    (typeof document !== 'undefined'
        && typeof document.getElementById === 'function'
        && window
        && typeof window.Event === 'function'
    );
let embeddingOrigin = '';
let runningInI = false;

if (runningInB) {
    // in case we are running in an iframe, parent and window are different, in
    // that case we use the referrer
    runningInI = parent !== window;
    embeddingOrigin = runningInI ? document.referrer : window.location.origin;
} else {
    embeddingOrigin = 'direct';
}

/**
 * Check if we are running in internet explorer (arrrggghhhh!!!!)
 */
const runningInInternetExplorer = (): boolean => {
    return runningInIE;
};

/**
 * Check if we are running in a browser
 */
const runningInBrowser = (): boolean => {
    return runningInB;
};

/**
 * Check if we are running in an iframe
 */
const runningInIframe = (): boolean => {
    return runningInI;
};

/**
 * Get guessed origin of embedding website
 */
const origin = (): string => {
    return embeddingOrigin + '';
};

export default {
    runningInInternetExplorer,
    runningInBrowser,
    runningInIframe,
    origin
}