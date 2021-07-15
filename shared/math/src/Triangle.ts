import { mat4, vec3 } from 'gl-matrix'

import { IGeometry } from './IGeometry'

export class Triangle implements IGeometry {
    constructor(
        private _v0: vec3 = vec3.create(),
        private _v1: vec3 = vec3.create(),
        private _v2: vec3 = vec3.create(),
    ) { }

    containsPoint(point: vec3): boolean {
        throw new Error('Method not implemented.');
    }

    clampPoint(point: vec3): vec3 {
        throw new Error('Method not implemented.');
    }

    applyMatrix(matrix: mat4): IGeometry {
        vec3.transformMat4(this._v0, this._v0, matrix);
        vec3.transformMat4(this._v1, this._v1, matrix);
        vec3.transformMat4(this._v2, this._v2, matrix);
        return this;
    }

    clone(): IGeometry {
        return new Triangle(vec3.clone(this._v0), vec3.clone(this._v1), vec3.clone(this._v2));
    }

    // Möller–Trumbore intersection algorithm
    intersect(origin: vec3, direction: vec3): number | null {
        const EPSILON = 0.0000001;
        const edge1 = vec3.sub(vec3.create(), this._v1, this._v0);
        const edge2 = vec3.sub(vec3.create(), this._v2, this._v0);
        const h = vec3.cross(vec3.create(), direction, edge2)
        const a = vec3.dot(edge1, h);
        if (a > -EPSILON && a < EPSILON)
            return null;    // This ray is parallel to this triangle.
        const f = 1.0 / a;
        const s = vec3.sub(vec3.create(), origin, this._v0);
        const u = f * vec3.dot(s, h);
        if (u < 0.0 || u > 1.0)
            return null;
        const q = vec3.cross(vec3.create(), s, edge1);
        const v = f * vec3.dot(direction, q);
        if (v < 0.0 || u + v > 1.0)
            return null;
        // At this stage we can compute t to find out where the intersection point is on the line.
        const t = f * vec3.dot(edge2, q);
        return t > EPSILON ? t : null;
    }
}