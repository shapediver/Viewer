import { mat4, vec3 } from 'gl-matrix'
import { Sphere } from '..';
import { IBox } from '../interfaces/IBox';
import { ISphere } from '../interfaces/ISphere';


export class Box implements IBox {
    // #region Properties (2)

    private _boundingSphere: ISphere = new Sphere();
    private _boundingSphereState: { min: vec3, max: vec3 } = {
        min: vec3.create(), max: vec3.create()
    }

    // #endregion Properties (2)

    // #region Constructors (1)
    constructor(
        private _min: vec3 = vec3.fromValues(Infinity, Infinity, Infinity),
        private _max: vec3 = vec3.fromValues(-Infinity, -Infinity, -Infinity)
    ) { }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    public intersect(origin: vec3, direction: vec3): number | null {
        let tmin, tmax, txmin, txmax, tymin, tymax, tzmin, tzmax;

        const invdirx = 1 / direction[0],
            invdiry = 1 / direction[1],
            invdirz = 1 / direction[2];

        txmin = invdirx >= 0 ? (this.min[0] - origin[0]) * invdirx : (this.max[0] - origin[0]) * invdirx;
        txmax = invdirx >= 0 ? (this.max[0] - origin[0]) * invdirx : (this.min[0] - origin[0]) * invdirx;
        tmin = txmin;
        tmax = txmax;

        tymin = invdiry >= 0 ? (this.min[1] - origin[1]) * invdiry : (this.max[1] - origin[1]) * invdiry;
        tymax = invdiry >= 0 ? (this.max[1] - origin[1]) * invdiry : (this.min[1] - origin[1]) * invdiry;

        if ((tmin > tymax) || (tymin > tmax)) return null;

        // These lines also handle the case where tmin or tmax is NaN
        // (result of 0 * Infinity). x !== x returns true if x is NaN

        if (tymin > tmin || tmin !== tmin) tmin = tymin;
        if (tymax < tmax || tmax !== tmax) tmax = tymax;

        tzmin = invdirz >= 0 ? (this.min[2] - origin[2]) * invdirz : (this.max[2] - origin[2]) * invdirz;
        tzmax = invdirz >= 0 ? (this.max[2] - origin[2]) * invdirz : (this.min[2] - origin[2]) * invdirz;

        if ((tmin > tzmax) || (tzmin > tmax)) return null;
        if (tzmin > tmin || tmin !== tmin) tmin = tzmin;
        if (tzmax < tmax || tmax !== tmax) tmax = tzmax;

        //return point closest to the ray (positive side)
        if (tmax < 0) return null;
        return tmin >= 0 ? tmin : tmax;
    };


    public get boundingSphere(): ISphere {
        if (!(this._boundingSphereState.min[0] === this.min[0] && this._boundingSphereState.min[1] === this.min[1] && this._boundingSphereState.min[2] === this.min[2] &&
            this._boundingSphereState.max[0] === this.max[0] && this._boundingSphereState.max[1] === this.max[1] && this._boundingSphereState.max[2] === this.max[2])) {
            this._boundingSphere.setFromBox(this);
            this._boundingSphereState = {
                min: vec3.clone(this.min),
                max: vec3.clone(this.max)
            };
        }
        return this._boundingSphere;
    }

    public get max(): vec3 {
        return this._max;
    }

    public set max(value: vec3) {
        this._max = value;
    }

    public get min(): vec3 {
        return this._min;
    }

    public set min(value: vec3) {
        this._min = value;
    }

    // #endregion Public Accessors (5)

    // #region Public Methods (5)

    public applyMatrix(matrix: mat4): Box {
        const points: vec3[] = [];
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.min[1], this.min[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.min[1], this.max[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.max[1], this.min[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.max[1], this.max[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.min[1], this.min[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.min[1], this.max[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.max[1], this.min[2]), matrix));
        points.push(vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.max[1], this.max[2]), matrix));

        this.min = vec3.fromValues(Infinity, Infinity, Infinity);
        this.max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

		for ( let i = 0, il = points.length; i < il; i ++ ) {
            this.min = vec3.fromValues(Math.min(this.min[0], points[i][0]), Math.min(this.min[1], points[i][1]), Math.min(this.min[2], points[i][2]));
            this.max = vec3.fromValues(Math.max(this.max[0], points[i][0]), Math.max(this.max[1], points[i][1]), Math.max(this.max[2], points[i][2]));
		}
        return this;
    }

    public clone(): IBox {
        return new Box(vec3.clone(this.min), vec3.clone(this.max))
    }

    public containsPoint(point: vec3): boolean {
        return point[0] < this.min[0] || point[0] > this.max[0] ||
            point[1] < this.min[1] || point[1] > this.max[1] ||
            point[2] < this.min[2] || point[2] > this.max[2] ? false : true;
    }

    public clampPoint(point: vec3): vec3 {
        point[0] = Math.max(this.min[0], Math.min(this.max[0], point[0]));
        point[1] = Math.max(this.min[1], Math.min(this.max[1], point[1]));
        point[2] = Math.max(this.min[2], Math.min(this.max[2], point[2]));
        return point;
    }

    public setFromAttributeArray(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array): IBox {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < array.length; i += 3) {
            const x = array[i];
            const y = array[i + 1];
            const z = array[i + 2];

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        this.min = vec3.fromValues(minX, minY, minZ);
        this.max = vec3.fromValues(maxX, maxY, maxZ);
        return this;
    }

    public union(box: IBox): IBox {
        if (box.min[0] < this.min[0]) this.min[0] = box.min[0];
        if (box.min[1] < this.min[1]) this.min[1] = box.min[1];
        if (box.min[2] < this.min[2]) this.min[2] = box.min[2];

        if (box.max[0] > this.max[0]) this.max[0] = box.max[0];
        if (box.max[1] > this.max[1]) this.max[1] = box.max[1];
        if (box.max[2] > this.max[2]) this.max[2] = box.max[2];
        return this;
    }

    public isEmpty(): boolean {
        return this.min[0] === Infinity && this.min[1] === Infinity && this.min[2] === Infinity && 
            this.max[0] === -Infinity && this.max[1] === -Infinity && this.max[2] === -Infinity;
    }

    public reset(): void {
        this._boundingSphere = new Sphere();
        this._boundingSphereState = {
            min: vec3.create(), max: vec3.create()
        }

        this._min = vec3.fromValues(Infinity, Infinity, Infinity);
        this._max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    }

    // #endregion Public Methods (5)
}