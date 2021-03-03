import { mat4, vec3 } from "gl-matrix";
import * as THREE from "three";
import { ICameraControls } from "../../interface/ICameraControls";
import { ICameraInterpolation } from "../../interface/ICameraInterpolation";

export class CameraOrthographicInterpolation implements ICameraInterpolation {
    // #region Constructors (1)

    constructor(private readonly _cameraControls: ICameraControls,
        private readonly _camera: THREE.OrthographicCamera,
        private readonly _from: { position: THREE.Vector3, target: THREE.Vector3 },
        private readonly _to: { position: THREE.Vector3, target: THREE.Vector3 }) 
    {
    }

    // #endregion Constructors (1)

        
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
    
    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        let positionOffset = new THREE.Vector3(this._to.position.x, this._to.position.y, this._to.position.z).sub(this.convertGlVectorToThreeVector(this._cameraControls.position));
        this._cameraControls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(positionOffset.x, positionOffset.y, positionOffset.z)));
        let targetOffset = new THREE.Vector3(this._to.target.x, this._to.target.y, this._to.target.z).sub(this.convertGlVectorToThreeVector(this._cameraControls.target));
        this._cameraControls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(targetOffset.x, targetOffset.y, targetOffset.z)));
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        let t: THREE.Vector3 = this._from.target.clone().multiplyScalar(1 - value.delta).add(this._to.target.clone().multiplyScalar(value.delta));
        let targetOffset = t.clone().sub(this.convertGlVectorToThreeVector(this._cameraControls.target));
        this._cameraControls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(targetOffset.x, targetOffset.y, targetOffset.z)));

        let p: THREE.Vector3 = this._from.position.clone().multiplyScalar(1 - value.delta).add(this._to.position.clone().multiplyScalar(value.delta));
        let positionOffset = p.clone().sub(this.convertGlVectorToThreeVector(this._cameraControls.position));
        this._cameraControls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(positionOffset.x, positionOffset.y, positionOffset.z)));
    }

    // #endregion Public Methods (3)
}