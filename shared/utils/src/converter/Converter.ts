import { vec3, vec4 } from 'gl-matrix'
import { TinyColor } from '@ctrl/tinycolor';
import { singleton } from 'tsyringe';

@singleton()
export class Converter {

    private tinyColorToVec3(color: TinyColor): vec4 {
        return vec4.fromValues(color.r, color.g, color.b, color.a);
    }

    /**
     * This color converter is mostly left 'as-is' from viewer v2.
     * I didn't want to break something that works.
     * 
     * @param color 
     * @param defColor 
     */
    public toColor(color: any, defColor: vec4 = vec4.fromValues(1, 1, 1, 1)): vec4 {
        if (!color) return defColor;

        const tColor = new TinyColor(color);

        if(color instanceof TinyColor)
            return this.tinyColorToVec3(tColor);

        // check if we got a number
        if (typeof color === 'number') {
            let cs = color.toString(16);
            let cl = cs.length;
            if (cl < 3) cs = cs.padStart(3, '0');
            else if (cl < 6) cs = cs.padStart(6, '0');
            else if (cl < 8) cs = cs.padEnd(8, '0');
            let tc = new TinyColor(cs);
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // check if the input is a THREE.Color
        if (color.isColor && typeof color.getHexString == 'function') {
            let tc = new TinyColor(color.getHexString());
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
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
                return defColor;

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
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // if we got something other than a string, check if
        // tinycolor can work with it
        if (typeof color !== 'string') {
            let tc = new TinyColor(color);
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // tinycolor doesn't like 0x
        var tmpColor = color.replace('0x', '#');

        // if we got no alpha value, add full opacity
        if (tmpColor.match(/^#[a-f0-9]{6}$/i) !== null) {
            let tc = new TinyColor(tmpColor + 'ff');
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // standard case
        if (tmpColor.match(/^#[a-f0-9]{8}$/i) !== null) {
            let tc = new TinyColor(tmpColor);
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // correct number which have the alpha value defined as a single hex digit
        if (tmpColor.match(/^#[a-f0-9]{7}$/i) !== null) {
            let tc = new TinyColor(tmpColor.slice(0, 7) + '0' + tmpColor.slice(-1));
            return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
        }

        // check if tinycolor understands the string
        let tc = new TinyColor(tmpColor);
        return tc.isValid ? this.tinyColorToVec3(tc) : defColor;
    }

    public toVec3(point: any): vec3 {
        if(Array.isArray(point) && point.length >= 3 && typeof point[0] === 'number' && typeof point[1] === 'number'&& typeof point[2] === 'number')
            return vec3.fromValues(point[0], point[1], point[2]);

        if(((point.x || point.x === 0) && typeof point.x === 'number') && ((point.y || point.y === 0) && typeof point.y === 'number') && ((point.z || point.z === 0) && typeof point.z === 'number'))
            return vec3.fromValues(point.x, point.y, point.z);

        return vec3.create();
    }
}