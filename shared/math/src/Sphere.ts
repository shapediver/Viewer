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

    public intersect(origin: vec3, direction: vec3): number | null {
        const vector = vec3.subtract(vec3.create(), this.center, origin)
		const tca = vec3.dot(vector, direction);
		const d2 = vec3.dot(vector, vector) - tca * tca;
		const radius2 = this.radius * this.radius;

		if ( d2 > radius2 ) return null;

		const thc = Math.sqrt( radius2 - d2 );

		// t0 = first intersect point - entrance on front of sphere
		const t0 = tca - thc;

		// t1 = second intersect point - exit point on back of sphere
		const t1 = tca + thc;

		// test to see if both t0 and t1 are behind the ray - if so, return null
		if ( t0 < 0 && t1 < 0 ) return null;

		// test to see if t0 is behind the ray:
		// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
		// in order to always return an intersect point that is in front of the ray.
		if ( t0 < 0 ) return t1;

		// else t0 is in front of the ray, so return the first collision point scaled by t0
		return t0;
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
        return ( vec3.squaredDistance(point, this.center ) <= ( this.radius * this.radius ) );
    }
    
    public clampPoint(point: vec3): vec3 {
        return point;
    }

    public setFromBox(box: Box): Sphere {
        vec3.add(this.center, box.min, box.max);
        vec3.scale(this.center, this.center, 0.5);
        this.radius = vec3.dist(box.min, box.max) * 0.5;
        return this;
    }

    // #endregion Public Methods (4)
}