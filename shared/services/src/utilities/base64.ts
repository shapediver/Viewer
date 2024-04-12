export const atobCustom = (str: string): string => {
    if(typeof window !== 'undefined' && window.atob) {
        return window.atob(str);
    } else {
        return Buffer.from(str, 'base64').toString();
    }
};

export const btoaCustom = (str: string): string => {
    if(typeof window !== 'undefined' && window.btoa) {
        return window.btoa(str);
    } else {
        return Buffer.from(str).toString('base64');
    }
};