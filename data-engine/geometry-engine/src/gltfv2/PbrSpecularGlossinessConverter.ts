/**
 * Adjusted from the original implementation from Luka Erkapic.
 */

import { Converter } from "@shapediver/viewer.shared.utils";
import { vec3, vec4 } from "gl-matrix";
import { container } from "tsyringe";

export class PbrMaterialConverter {
    // #region Properties (2)

    private readonly _dielectricSpecular = vec3.fromValues(0.04, 0.04, 0.04);
    private readonly _epsilon = 1e-6;
    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    // #endregion Properties (2)

    // #region Public Methods (1)

    public convertToMetallicRoughness(specGlossiness: {
        diffuseFactor: vec4,
        specularFactor: vec3,
        glossinessFactor: number
    }): {
        color: string,
        metalness: number,
        roughness: number
    } {
        const diffuse = specGlossiness.diffuseFactor;
        const specular = specGlossiness.specularFactor;
        const glossiness = specGlossiness.glossinessFactor;

        const oneMinusSpecularStrength = 1 - Math.max(specular[0], specular[1], specular[2]);
        const metalness = this.solveMetallic(this.getPerceivedBrightness(vec3.fromValues(diffuse[0], diffuse[1], diffuse[2])), this.getPerceivedBrightness(specular), oneMinusSpecularStrength);

        const colorFromDiffuse = diffuse.map((x: number) => x * (oneMinusSpecularStrength / (1 - this._dielectricSpecular[0]) / Math.max(1 - metalness, this._epsilon)));

        const die = this._dielectricSpecular.map((x: number) => x * (1 - metalness)).map((x: number) => x * (1 / Math.max(metalness, this._epsilon)))

        const colorFromSpecular = vec3.sub(vec3.create(), specular, vec3.fromValues(die[0], die[1], die[2]));
        const color = vec3.lerp(vec3.create(), vec3.fromValues(colorFromDiffuse[0], colorFromDiffuse[1], colorFromDiffuse[2]), colorFromSpecular, metalness * metalness).map((x: number) => this.clamp(x));

        return {
            color: this._converter.toColor(vec4.fromValues(color[0], color[1], color[2], diffuse[3])),
            metalness: metalness,
            roughness: 1 - glossiness
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (3)

    private clamp(v: number, min: number = 0, max: number = 1): number {
        if (v > max) return max;
        else if (v < min) return min;
        return v;
    }

    private getPerceivedBrightness(color: vec3): number {
        const r = color[0];
        const g = color[1];
        const b = color[2];
        return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
    }

    private solveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number): number {
        if (specular < this._dielectricSpecular[0]) {
            return 0;
        }

        const a = this._dielectricSpecular[0];
        const b = diffuse * oneMinusSpecularStrength / (1 - this._dielectricSpecular[0]) + specular - 2 * this._dielectricSpecular[0];
        const c = this._dielectricSpecular[0] - specular;
        const d = Math.max(b * b - 4 * a * c, 0);

        return this.clamp((- b + Math.sqrt(d)) / (2 * a), 0, 1);
    }

    // #endregion Private Methods (3)
}
