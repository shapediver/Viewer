import { vec3 } from 'gl-matrix'
import { ISpherical } from '../interfaces/ISpherical';

export class Spherical implements ISpherical {
    constructor(
        private _radius: number = 1,
        private _phi: number = 0,
        private _theta: number = 0,
    ) { }


    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        this._radius = value;
    }


    public get phi(): number {
        return this._phi;
    }

    public set phi(value: number) {
        this._phi = value;
    }


    public get theta(): number {
        return this._theta;
    }

    public set theta(value: number) {
        this._theta = value;
    }

    public makeSafe() {
        const EPS = 0.000001;
        this.phi = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ));
        return this;
    }

    public fromVec3(p: vec3): ISpherical {
        this.radius = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);

        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2(p[0], p[2]);
            this.phi = Math.acos(Math.max(-1, Math.min(1, p[1] / this.radius)));
        }
        return this;
    }

    public toVec3(): vec3 {
        const sinPhiRadius = Math.sin( this.phi ) * this.radius;
        return vec3.fromValues(sinPhiRadius * Math.sin( this.theta ), Math.cos( this.phi ) * this.radius, sinPhiRadius * Math.cos( this.theta ));
    }
}