import { mat4, vec3 } from 'gl-matrix'
import { Box } from './Box';
import { IGeometry } from './IGeometry';

export class Sphere implements IGeometry {
    // #region Constructors (1)

    constructor(
        private _center: vec3 = vec3.create(),
        private _radius: number = 0
    ) { }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    public get center(): vec3 {
        return this._center;
    }

    public set center(value: vec3) {
        this._center = value;
    }

    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        this._radius = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (4)

    public applyMatrix(matrix: mat4): Sphere {
        throw new Error('Method not implemented.');
    }

    public clone(): Sphere {
        throw new Error('Method not implemented.');
    }

    public containsPoint(point: vec3): boolean {
        return false;
        throw new Error('Method not implemented.');
    }
    
    public clampPoint(point: vec3): vec3 {
        return point;
        throw new Error('Method not implemented.');
    }

    public setFromBox(box: Box): Sphere {
        vec3.add(this.center, box.min, box.max);
        vec3.scale(this.center, this.center, 0.5);
        this.radius = vec3.dist(box.min, box.max) * 0.5;
        return this;
    }

    // #endregion Public Methods (4)
}