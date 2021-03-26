import { vec3 } from 'gl-matrix'
import { Box } from './Box';

export class Sphere {
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

    // #region Public Methods (1)

    public setFromBox(box: Box): Sphere {
        vec3.add(this.center, box.min, box.max);
        vec3.scale(this.center, this.center, 0.5);
        this.radius = vec3.dist(box.min, box.max) * 0.5;
        return this;
    }

    // #endregion Public Methods (1)
}