import { mat4, vec3 } from 'gl-matrix'
import { IBox } from '../interfaces/IBox';
import { ISphere } from '../interfaces/ISphere';

export class Sphere implements ISphere {
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
        this._center = vec3.transformMat4(vec3.create(), this._center, matrix);
        const scaleXSq = matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2];
        const scaleYSq = matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6];
        const scaleZSq = matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10];
        const maxScaleOnAxis = Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
        this.radius = this.radius * maxScaleOnAxis;
        return this;
    }

    public clone(): ISphere {
        return new Sphere(vec3.clone(this._center), this._radius);
    }

    public containsPoint(point: vec3): boolean {
        return (vec3.squaredDistance(point, this.center) <= (this.radius * this.radius));
    }

    public clampPoint(point: vec3): vec3 {
        return point;
    }

    public setFromBox(box: IBox): ISphere {
        vec3.add(this.center, box.min, box.max);
        vec3.scale(this.center, this.center, 0.5);
        this.radius = vec3.dist(box.min, box.max) * 0.5;
        return this;
    }

    public reset() {
        this._center = vec3.create();
        this._radius = 0;
    }

    // #endregion Public Methods (4)
}