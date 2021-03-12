import { mat4, vec3 } from "gl-matrix";
import * as THREE from "three";
import { ICameraControlsUsage } from "../../interface/ICameraControlsUsage";
import { ICameraInterpolation } from "../../interface/ICameraInterpolation";

export class CameraMultipleInterpolation implements ICameraInterpolation {
    // #region Properties (1)

    public end: {
        position: { x: number[], y: number[], z: number[] },
        target: { x: number[], y: number[], z: number[] }
    } = {
        position: { x: [], y: [], z: [] },
        target: { x: [], y: [], z: [] }
    };

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private readonly _cameraControls: ICameraControlsUsage, 
        private readonly _path: { position: THREE.Vector3, target: THREE.Vector3 }[],
        private readonly _interpolationFunction: Function)
    {
        for(let i = 0; i < this._path.length; i++) {
            this.end.position.x.push(this._path[i].position.x);
            this.end.position.y.push(this._path[i].position.y);
            this.end.position.z.push(this._path[i].position.z);
            this.end.target.x.push(this._path[i].target.x);
            this.end.target.y.push(this._path[i].target.y);
            this.end.target.z.push(this._path[i].target.z);
        }
    }

        
    private convertGlMatrixToThreeMatrix(matrix: mat4): THREE.Matrix4 {
        return new THREE.Matrix4().fromArray(matrix);
    }

    private convertGlVectorToThreeVector(vec: vec3): THREE.Vector3 {
        return new THREE.Vector3(vec[0], vec[1], vec[2]);
    }

    private convertThreeMatrixToGlMatrix(matrix: THREE.Matrix4): mat4 {
        return mat4.fromValues( matrix.toArray()[0], matrix.toArray()[1], matrix.toArray()[2], matrix.toArray()[3],
                                matrix.toArray()[4], matrix.toArray()[5], matrix.toArray()[6], matrix.toArray()[7],
                                matrix.toArray()[8], matrix.toArray()[9], matrix.toArray()[10], matrix.toArray()[11],
                                matrix.toArray()[12], matrix.toArray()[13], matrix.toArray()[14], matrix.toArray()[15]);
    }

    private convertThreeVectorToGlVector(vec: THREE.Vector3): vec3 {
        return vec3.fromValues(vec.x, vec.y, vec.z);
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        let positionOffset = new THREE.Vector3(this._path[this._path.length-1].position.x, this._path[this._path.length-1].position.y, this._path[this._path.length-1].position.z).sub(this.convertGlVectorToThreeVector(this._cameraControls.position));
        this._cameraControls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(positionOffset.x, positionOffset.y, positionOffset.z)));
        let targetOffset = new THREE.Vector3(this._path[this._path.length-1].target.x, this._path[this._path.length-1].target.y, this._path[this._path.length-1].target.z).sub(this.convertGlVectorToThreeVector(this._cameraControls.target));
        this._cameraControls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(targetOffset.x, targetOffset.y, targetOffset.z)));
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        let p: THREE.Vector3 = new THREE.Vector3(this._interpolationFunction(this.end.position.x, value.delta), this._interpolationFunction(this.end.position.y, value.delta), this._interpolationFunction(this.end.position.z, value.delta));
        let positionOffset = p.clone().sub(this.convertGlVectorToThreeVector(this._cameraControls.position));
        this._cameraControls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(positionOffset.x, positionOffset.y, positionOffset.z)));

        let t: THREE.Vector3 = new THREE.Vector3(this._interpolationFunction(this.end.target.x, value.delta), this._interpolationFunction(this.end.target.y, value.delta), this._interpolationFunction(this.end.target.z, value.delta));
        let targetOffset = t.clone().sub(this.convertGlVectorToThreeVector(this._cameraControls.target));
        this._cameraControls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(targetOffset.x, targetOffset.y, targetOffset.z)));
    }

    // #endregion Public Methods (3)
}