import { vec3, vec4 } from 'gl-matrix'
import { TinyColor } from '@ctrl/tinycolor'
import { singleton } from 'tsyringe'

@singleton()
export class Converter {

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

    public toThreeJsColorInput(color: string): string {
        const c = this.toColor(color);
        return c.slice(0, c.length - 2);
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
        var tmpColor = color.replace('0x', '#');

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
}