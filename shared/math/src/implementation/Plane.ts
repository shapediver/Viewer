import { mat3, mat4, vec3 } from 'gl-matrix'
import { IPlane } from '../interfaces/IPlane';


export class Plane implements IPlane {

    // #region Constructors (1)

    constructor(private _normal: vec3 = vec3.fromValues(1,0,0), private _constant: number = 0) {}

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    public get constant(): number {
		return this._constant;
	}

    public set constant(value: number) {
		this._constant = value;
	}

    public get normal(): vec3 {
		return this._normal;
	}

    public set normal(value: vec3) {
		this._normal = value;
	}

    // #endregion Public Accessors (4)

    // #region Public Methods (7)

    public applyMatrix(matrix: mat4): IPlane {
        const normalMatrix = mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), matrix)))
        const p = vec3.transformMat4(vec3.create(), vec3.multiply(vec3.create(), vec3.clone(this.normal), vec3.fromValues(this._constant, this._constant, this._constant)), matrix)
        this._normal = vec3.normalize(vec3.create(), vec3.transformMat3(vec3.create(), this._normal, normalMatrix));
		this.constant = -vec3.dot(p, this._normal);
		return this;
    }

    public clampPoint(point: vec3): vec3 {
        const d = -this.distanceToPoint(point);
        return vec3.add(vec3.create(), vec3.multiply(vec3.create(), this.normal, vec3.fromValues(d, d, d)), point);
    }

    public clone(): IPlane {
        return new Plane(this._normal, this._constant);
    }

    public containsPoint(point: vec3): boolean {
         return this.distanceToPoint(point) === 0;
    }

    public distanceToPoint(point: vec3): number {
        return vec3.dot(this.normal, point) + this.constant;
    }

    public intersect(origin: vec3, direction: vec3): number | null {
		const denominator = vec3.dot(this.normal, direction);
		if (denominator === 0) {
			// line is coplanar, return origin
			if (this.distanceToPoint( origin ) === 0) return 0;
			// Null is preferable to undefined since undefined means.... it is undefined
			return null;
		}
		const t = - (vec3.dot(origin, this.normal) + this.constant) / denominator;
		if ( t < 0 ) return null;

        return t; //vec3.add(vec3.create(), vec3.multiply(vec3.create(), direction, vec3.fromValues(t,t,t)), origin);
    }

    public setFromNormalAndCoplanarPoint(normal: vec3, point: vec3): IPlane {
        vec3.copy(this.normal, normal);
		this.constant = -vec3.dot(point, this.normal);
		return this;
    }

    public reset() {
        this._normal = vec3.fromValues(1,0,0);
        this._constant = 0;
    }

    // #endregion Public Methods (7)
}