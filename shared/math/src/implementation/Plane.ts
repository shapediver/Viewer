import {mat3, mat4, vec3} from "gl-matrix";

import {IPlane} from "@shapediver/viewer.shared.types";

export class Plane implements IPlane {
	private _normal: vec3 = vec3.fromValues(1, 0, 0);
	constructor(
		private _vector_u: vec3 = vec3.fromValues(0, 1, 0),
		private _vector_v: vec3 = vec3.fromValues(0, 0, 1),
		private _constant: number = 0,
	) {
		this._normal = vec3.normalize(
			vec3.create(),
			vec3.cross(vec3.create(), this._vector_u, this._vector_v),
		);
	}

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

	public get vector_u(): vec3 {
		return this._vector_u;
	}

	public set vector_u(value: vec3) {
		this._vector_u = value;
	}

	public get vector_v(): vec3 {
		return this._vector_v;
	}

	public set vector_v(value: vec3) {
		this._vector_v = value;
	}

	public applyMatrix(matrix: mat4): IPlane {
		const upperLeft = mat3.fromMat4(mat3.create(), matrix);
		let inverse = mat3.invert(mat3.create(), upperLeft);
		if (!inverse) inverse = mat3.create();
		const normalMatrix = mat3.transpose(mat3.create(), inverse);
		const p = vec3.transformMat4(
			vec3.create(),
			vec3.multiply(
				vec3.create(),
				vec3.clone(this.normal),
				vec3.fromValues(this._constant, this._constant, this._constant),
			),
			matrix,
		);
		this._normal = vec3.normalize(
			vec3.create(),
			vec3.transformMat3(vec3.create(), this._normal, normalMatrix),
		);
		this._vector_u = vec3.normalize(
			vec3.create(),
			vec3.transformMat3(vec3.create(), this._vector_u, upperLeft),
		);
		this._vector_v = vec3.normalize(
			vec3.create(),
			vec3.transformMat3(vec3.create(), this._vector_v, upperLeft),
		);
		this.constant = -vec3.dot(p, this._normal);
		return this;
	}

	public clampPoint(point: vec3): vec3 {
		const d = -this.distanceToPoint(point);
		return vec3.add(
			vec3.create(),
			vec3.multiply(vec3.create(), this.normal, vec3.fromValues(d, d, d)),
			point,
		);
	}

	public clone(): IPlane {
		return new Plane(
			vec3.clone(this._vector_u),
			vec3.clone(this._vector_v),
			this._constant,
		);
	}

	public containsPoint(point: vec3): boolean {
		return this.distanceToPoint(point) === 0;
	}

	public convertFromLSToWS(point: vec3): vec3 {
		const origin = vec3.scale(vec3.create(), this._normal, -this._constant);
		return vec3.add(
			vec3.create(),
			vec3.add(
				vec3.create(),
				vec3.add(
					vec3.create(),
					origin,
					vec3.scale(vec3.create(), this._vector_u, point[0]),
				),
				vec3.scale(vec3.create(), this._vector_v, point[1]),
			),
			vec3.scale(vec3.create(), this._normal, point[2]),
		);
	}

	public convertFromWSToLS(point: vec3, project: boolean = true): vec3 {
		const origin = vec3.scale(vec3.create(), this._normal, -this._constant);
		const d = vec3.subtract(vec3.create(), point, origin);
		return vec3.fromValues(
			vec3.dot(d, this._vector_u),
			vec3.dot(d, this._vector_v),
			project ? 0 : vec3.dot(d, this._normal),
		);
	}

	public distanceToPoint(point: vec3): number {
		return vec3.dot(this.normal, point) + this.constant;
	}

	public intersect(origin: vec3, direction: vec3): number | null {
		const denominator = vec3.dot(this.normal, direction);
		if (denominator === 0) {
			// line is coplanar, return origin
			if (this.distanceToPoint(origin) === 0) return 0;
			return null;
		}
		const t =
			-(vec3.dot(origin, this.normal) + this.constant) / denominator;
		if (t < 0) return null;

		return t;
	}

	public reset() {
		this._normal = vec3.fromValues(1, 0, 0);
		this._vector_u = vec3.fromValues(0, 1, 0);
		this._vector_v = vec3.fromValues(0, 0, 1);
		this._constant = 0;
	}

	public setFromNormalAndCoplanarPoint(normal: vec3, point: vec3): IPlane {
		vec3.copy(this._normal, normal);
		const up =
			Math.abs(normal[1]) < 0.9
				? vec3.fromValues(0, 1, 0)
				: vec3.fromValues(1, 0, 0);
		this._vector_u = vec3.normalize(
			vec3.create(),
			vec3.cross(vec3.create(), up, normal),
		);
		this._vector_v = vec3.normalize(
			vec3.create(),
			vec3.cross(vec3.create(), normal, this._vector_u),
		);
		this.constant = -vec3.dot(point, this._normal);
		return this;
	}
}
