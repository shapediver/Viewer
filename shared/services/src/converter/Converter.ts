import { vec3, vec4 } from 'gl-matrix'
import { TinyColor } from '@ctrl/tinycolor'
import { container, singleton } from 'tsyringe'
import { HttpClient } from '../http-client/HttpClient';
import { HttpResponse } from '../http-client/HttpResponse';

@singleton()
export class Converter {
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);

    private tinyColorToString(color: TinyColor): string {
        return color.toHex8String();
    }

    /**
     * @param color 
     * @param defColor 
     */
    public toHex8Color(color: any, defColorString: string = '#00fff7'): string {
        const c = this.toColor(color, defColorString);
        const tColor = new TinyColor(c);
        const cH8 = tColor.toHex8String();
        return cH8.replace('#', '0x');
    }

    public toColorArray(color: string): number[] {
        const tColor = new TinyColor(color);
        const rgb = tColor.toRgb()
        return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
    }

    public toAlpha(color: string): number {
        const c = this.toColor(color);
        if (c.length <= 8) return 1;
        return parseInt(c.slice(c.length - 2, c.length), 16) / 255;
    }

    public toThreeJsColorInput(color: string): string {
        const c = this.toColor(color);
        return c.slice(0, c.length - 2);
    }


    public async processSVG(blob: Blob): Promise<HTMLImageElement> {
        let data = <string>await new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(<string>reader.result);
            reader.readAsDataURL(blob);
        });
        data = data.replace('data:image/svg+xml;base64,', '')
        data = atob(data);

        let svgC = document.createElement('DIV');
        svgC.id = 'svgc';
        svgC.innerHTML = <string>data;

        // now we can access the svg element as a DOM object
        let svgE = svgC.getElementsByTagName('svg');
        let childImageURIs: string[] = [];
        let styleURIs: string[] = [];

        // collect image urls
        for (let i = 0; i < svgE.length; ++i) {
            for (let j = 0; j < 2; ++j) {
                let childImages = <HTMLCollectionOf<SVGImageElement>>svgE[i].getElementsByTagName(['image', 'img'][j]);
                for (let k = 0; k < childImages.length; ++k) {
                    if (childImages[k].href.baseVal.substring(0, 5) != 'data:') {
                        childImageURIs.push(childImages[k].href.baseVal);
                    }
                }
            }
            // collect potential font definitions
            // we assume styles are imported using the following syntax:
            // @import url(CSS_URL);
            let styleElements = <HTMLCollectionOf<HTMLStyleElement>>svgE[i].getElementsByTagName('style');
            for (let j = 0; j < styleElements.length; ++j) {
                let regex = /@import\x20url\(\s*(.*?)\s*\);/g;
                let m;
                while ((m = regex.exec(styleElements[j].innerHTML)) !== null) {
                    styleURIs.push(m[1]);
                }
                // make unique
                styleURIs = styleURIs.filter(
                    function (value, index, self) {
                        return self.indexOf(value) === index;
                    }
                );
            }
        }

        // creating a promise for each image which needs to be converted to a data URI
        let replacementPromises = [];
        let createImagePromise = async (uri: string) => {
            if (uri.length > 0) {
                const response = await this._httpClient.loadTexture(uri);
                let uInt8Array = new Uint8Array(response.data), i = uInt8Array.length;
                let biStr = []; //new Array(i);
                while (i--)
                    biStr[i] = String.fromCharCode(uInt8Array[i]);

                let base64Data = window.btoa(biStr.join(''));
                let imgDataUrl = 'data:' + response.headers['content-type'] + ';base64,' + base64Data;

                // replace url in SVG string
                // CAUTION theoretically this could cause unwanted replacements
                data = data.replace(uri, imgDataUrl);
            }
        };

        for (let i = 0; i < childImageURIs.length; ++i)
            replacementPromises.push(createImagePromise(childImageURIs[i]));

        // now we create promises for the google fonts to be imported
        let createStylePromise = async (styleUrl: string) => {
            const response = await this._httpClient.get(
                styleUrl,
                { responseType: 'text' }
            );
            let cssString = response.data;
            // we assume that fonts are imported using the following syntax:
            // url(FONT_URI);
            let fontURLs = [];
            let regex = /url\(\s*(.*?)\s*\)/g;
            let m;
            while ((m = regex.exec(cssString)) !== null) {
                fontURLs.push(m[1]);
            }

            let fontPromises = [];
            let createFontPromise = async (fUrl: string) => {
                const response = await this._httpClient.get(
                    fUrl,
                    { responseType: 'arraybuffer' }
                );
                let uInt8Array = new Uint8Array(response.data), i = uInt8Array.length;
                let biStr = []; //new Array(i);
                while (i--)
                    biStr[i] = String.fromCharCode(uInt8Array[i]);

                let base64Data = window.btoa(biStr.join(''));
                let fontDataUrl = 'data:' + response.headers['content-type'] + ';base64,' + base64Data;
                if (fUrl.length > 0)
                    cssString = cssString.replace(fUrl, fontDataUrl);
            };

            for (let j = 0; j < fontURLs.length; ++j)
                fontPromises.push(createFontPromise(fontURLs[j]));

            await Promise.all(fontPromises);
            data = data.replace('@import url(' + styleUrl + ');', cssString);
        };

        for (let i = 0; i < styleURIs.length; ++i)
            replacementPromises.push(createStylePromise(styleURIs[i]));

        await Promise.all(replacementPromises);

        let du = 'data:image/svg+xml,' + encodeURIComponent(data);
        let img = new Image(); // same as document.createElement('img')
        img.crossOrigin = 'Anonymous';
        const promise = new Promise<void>(resolve => {
            img.onload = () => resolve();
        })
        img.src = du;
        await promise;
        return img;
    }

    /**
     * This color converter is mostly left 'as-is' from viewer v2.
     * I didn't want to break something that works.
     * 
     * @param color 
     * @param defColor 
     */
    public toColor(color: any, defColorString: string = '#00fff7'): string {
        if (!color || color === 'default') return defColorString;

        if (color.constructor === Float32Array)
            color = Array.from(color);

        const tColor = new TinyColor(color);

        if (color instanceof TinyColor)
            return this.tinyColorToString(tColor);

        // check if we got a number
        if (typeof color === 'number') {
            let cs = color.toString(16);
            let cl = cs.length;
            if (cl < 3) cs = cs.padStart(3, '0');
            else if (cl < 6) cs = cs.padStart(6, '0');
            else if (cl < 8) cs = cs.padEnd(8, '0');
            let tc = new TinyColor(cs);
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // check if the input is a THREE.Color
        if (color.isColor && typeof color.getHexString == 'function') {
            let tc = new TinyColor(color.getHexString());
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // check for array of numbers
        if (Array.isArray(color) && (color.length == 3 || color.length == 4)) {
            let isRGBArray = true;
            for (let i = 0; i < 3; ++i) {
                color[i] = parseFloat(color[i]);
                if (isNaN(color[i])) {
                    isRGBArray = false;
                }
            }
            if (!isRGBArray)
                return defColorString;

            let tc = new TinyColor({
                r: Math.max(0, Math.min(color[0], 255)),
                g: Math.max(0, Math.min(color[1], 255)),
                b: Math.max(0, Math.min(color[2], 255))
            });
            if (color.length == 4) {
                let a = parseFloat(color[3]);
                if (!isNaN(a)) {
                    tc.setAlpha(Math.max(0, Math.min(a, 255)) / 255);
                }
            }
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // if we got something other than a string, check if
        // tinycolor can work with it
        if (typeof color !== 'string') {
            let tc = new TinyColor(color);
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // tinycolor doesn't like 0x
        let tmpColor = color.replace('0x', '#');

        // if we got no alpha value, add full opacity
        if (tmpColor.match(/^#[a-f0-9]{6}$/i) !== null) {
            let tc = new TinyColor(tmpColor + 'ff');
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // standard case
        if (tmpColor.match(/^#[a-f0-9]{8}$/i) !== null) {
            let tc = new TinyColor(tmpColor);
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // correct number which have the alpha value defined as a single hex digit
        if (tmpColor.match(/^#[a-f0-9]{7}$/i) !== null) {
            let tc = new TinyColor(tmpColor.slice(0, 7) + '0' + tmpColor.slice(-1));
            return tc.isValid ? this.tinyColorToString(tc) : defColorString;
        }

        // check if tinycolor understands the string
        let tc = new TinyColor(tmpColor);
        return tc.isValid ? this.tinyColorToString(tc) : defColorString;
    }

    public toVec3(point: any): vec3 {
        if (Array.isArray(point) && point.length >= 3 && typeof point[0] === 'number' && typeof point[1] === 'number' && typeof point[2] === 'number')
            return vec3.fromValues(point[0], point[1], point[2]);

        if (((point.x || point.x === 0) && typeof point.x === 'number') && ((point.y || point.y === 0) && typeof point.y === 'number') && ((point.z || point.z === 0) && typeof point.z === 'number'))
            return vec3.fromValues(point.x, point.y, point.z);

        if (((point.X || point.X === 0) && typeof point.X === 'number') && ((point.Y || point.Y === 0) && typeof point.Y === 'number') && ((point.Z || point.Z === 0) && typeof point.Z === 'number'))
            return vec3.fromValues(point.X, point.Y, point.Z);

        return vec3.create();
    }

    public async responseToImage(response: HttpResponse<ArrayBuffer>): Promise<HTMLImageElement> {
        const arrayBufferView = new Uint8Array( response.data );
        const blob = new Blob([ arrayBufferView ], { type: response.headers['content-type'] } );
        if (response.headers['content-type'] === 'image/svg+xml') {
            const img = await this.processSVG(blob);
            return img;
        } else {
            const img = new Image();
            const promise = new Promise<void>(resolve => {
                img.onload = () => resolve();
            })
            img.crossOrigin = "anonymous";
            img.src = URL.createObjectURL(blob);
            await promise;
            return img;
        }
    }
}