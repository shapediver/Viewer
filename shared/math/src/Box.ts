import { mat4, vec3 } from 'gl-matrix'
import { IGeometry } from './IGeometry';
import { Sphere } from './Sphere';

export class Box implements IGeometry {
    // #region Properties (2)

    private _boundingSphere: Sphere = new Sphere();
    private _boundingSphereState: { min: vec3, max: vec3 } = {
        min: vec3.create(), max: vec3.create()
    }

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(
        private _min: vec3 = vec3.create(), 
        private _max: vec3 = vec3.create()
        ) {}

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    public get boundingSphere(): Sphere {
        if(!(vec3.equals(this._boundingSphereState.min, this.min) && vec3.equals(this._boundingSphereState.max, this.max))) {
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
        vec3.transformMat4(this.min, this.min, matrix);
        vec3.transformMat4(this.max, this.max, matrix);
        return this;
    }

    public clone(): Box {
        return new Box(vec3.clone(this.min), vec3.clone(this.max))
    }

    public containsPoint(point: vec3): boolean {
        return false;
        throw new Error('Method not implemented.');
    }
    
    public clampPoint(point: vec3): vec3 {
        return point;
        throw new Error('Method not implemented.');
    }

    public setFromAttributeArray(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array): Box {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for(let i = 0; i < array.length; i += 3) {
            const x = array[i];
            const y = array[i+1];
            const z = array[i+2];

            if ( x < minX ) minX = x;
			if ( y < minY ) minY = y;
			if ( z < minZ ) minZ = z;

			if ( x > maxX ) maxX = x;
			if ( y > maxY ) maxY = y;
			if ( z > maxZ ) maxZ = z;
        }

        this.min = vec3.fromValues(minX, minY, minZ);
        this.max = vec3.fromValues(maxX, maxY, maxZ);
        return this;
    }

    public union(box: Box): Box {
        if ( box.min[0] < this.min[0] ) this.min[0] = box.min[0];
        if ( box.min[1] < this.min[1] ) this.min[1] = box.min[1];
        if ( box.min[2] < this.min[2] ) this.min[2] = box.min[2];

        if ( box.max[0] > this.max[0] ) this.max[0] = box.max[0];
        if ( box.max[1] > this.max[1] ) this.max[1] = box.max[1];
        if ( box.max[2] > this.max[2] ) this.max[2] = box.max[2];
        return this;
    }

    // #endregion Public Methods (5)
}