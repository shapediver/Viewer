import { mat4, vec3 } from "gl-matrix";
import * as THREE from "three";
import { ICameraControls } from "../../interface/ICameraControls";
import { ICameraInterpolation } from "../../interface/ICameraInterpolation";

export class CameraCylindricalInterpolation implements ICameraInterpolation {
    // #region Properties (10)

    private _dir_from: THREE.Vector3;
    private _dir_to: THREE.Vector3;
    private _from_position_heightAdjusted: THREE.Vector3;
    private _h_from: number;
    private _h_to: number;
    private _lorr: THREE.Vector3;
    private _r_from: number;
    private _r_to: number;
    private _shortest_angle: number;
    private _to_position_heightAdjusted: THREE.Vector3;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(private readonly _cameraControls: ICameraControls,
        private readonly _from: { position: THREE.Vector3, target: THREE.Vector3 },
        private readonly _to: { position: THREE.Vector3, target: THREE.Vector3 }) 
    {
        this._h_from = this._from.position.z - this._from.target.z;
        this._from_position_heightAdjusted = new THREE.Vector3(this._from.position.x, this._from.position.y, this._from.target.z);
        this._r_from = this._from_position_heightAdjusted.distanceTo(this._from.target);
        this._dir_from = this._from_position_heightAdjusted.sub(this._from.target).normalize();

        this._h_to = this._to.position.z - this._to.target.z;
        this._to_position_heightAdjusted = new THREE.Vector3(this._to.position.x, this._to.position.y, this._to.target.z);
        this._r_to = this._to_position_heightAdjusted.distanceTo(this._to.target);
        this._dir_to = this._to_position_heightAdjusted.sub(this._to.target).normalize();


        if (this._dir_from.x === 0 && this._dir_from.y === 0 && this._dir_from.z === 0)
            this._dir_from = new THREE.Vector3(1,0,0);

        if (this._dir_to.x === 0 && this._dir_to.y === 0 && this._dir_to.z === 0)
            this._dir_to = new THREE.Vector3(1,0,0);

        this._lorr = this._dir_to.clone().cross(this._dir_from);
        // This is why people hate JavaScript. The dot product of two normalized vector is larger than 1 on occasion due to precision errors...
        let dot1 = Math.min(1, Math.max(-1, this._dir_to.dot(this._dir_from))); 
        let dot2 = Math.min(1, Math.max(-1, this._lorr.dot(new THREE.Vector3(0, 0, 1)))); 
        this._shortest_angle = dot2 > 0 ? -Math.acos(dot1) : Math.acos(dot1);
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

        let angle = this._shortest_angle * value.delta;
        let dir = this._dir_from.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
        let p = t.clone().add(dir.clone().multiplyScalar((this._r_from * (1 - value.delta) + this._r_to * value.delta)));
        p.add(new THREE.Vector3(0, 0, (this._h_from * (1 - value.delta) + this._h_to * value.delta)));

        let positionOffset = p.clone().sub(this.convertGlVectorToThreeVector(this._cameraControls.position));
        this._cameraControls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(positionOffset.x, positionOffset.y, positionOffset.z)));
    }

    // #endregion Public Methods (3)
}