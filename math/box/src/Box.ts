import { mat4, vec3 } from 'gl-matrix'

export class Box {
    // #region Constructors (1)

    constructor(
        private _min: vec3 = vec3.create(), 
        private _max: vec3 = vec3.create()
        ) {}

    // #endregion Constructors (1)

    // #region Public Accessors (4)

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

    // #endregion Public Accessors (4)

    // #region Public Methods (4)

    public applyMatrix(matrix: mat4): void {
        vec3.transformMat4(this.min, this.min, matrix);
        vec3.transformMat4(this.max, this.max, matrix);
    }

    public clone(): Box {
        return new Box(vec3.clone(this.min), vec3.clone(this.max))
    }

    public setFromAttributeArray(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array) {
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
    }

    public union(box: Box): void {
        if ( box.min[0] < this.min[0] ) this.min[0] = box.min[0];
        if ( box.min[1] < this.min[1] ) this.min[1] = box.min[1];
        if ( box.min[2] < this.min[2] ) this.min[2] = box.min[2];

        if ( box.max[0] > this.max[0] ) this.max[0] = box.max[0];
        if ( box.max[1] > this.max[1] ) this.max[1] = box.max[1];
        if ( box.max[2] > this.max[2] ) this.max[2] = box.max[2];
    }

    // #endregion Public Methods (4)
}