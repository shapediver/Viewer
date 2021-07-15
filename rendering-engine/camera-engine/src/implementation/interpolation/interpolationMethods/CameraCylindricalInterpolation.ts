import { mat4, quat, vec3 } from 'gl-matrix'

import { ICamera } from '../../../interfaces/camera/ICamera'
import { ICameraControlsUsage } from '../../../interfaces/controls/ICameraControlsUsage'
import { ICameraInterpolation } from '../../../interfaces/interpolation/ICameraInterpolation'

export class CameraCylindricalInterpolation implements ICameraInterpolation {
    // #region Properties (10)

    private _dir_from: vec3;
    private _dir_to: vec3;
    private _from_position_heightAdjusted: vec3;
    private _h_from: number;
    private _h_to: number;
    private _lorr: vec3;
    private _r_from: number;
    private _r_to: number;
    private _shortest_angle: number;
    private _to_position_heightAdjusted: vec3;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(
        private readonly _camera: ICamera,
        private readonly _cameraControls: ICameraControlsUsage,
        private readonly _from: { position: vec3, target: vec3 },
        private readonly _to: { position: vec3, target: vec3 }) 
    {
        this._h_from = this._from.position[2] - this._from.target[2];
        this._from_position_heightAdjusted = vec3.fromValues(this._from.position[0], this._from.position[1], this._from.target[2]);
        this._r_from = vec3.distance(this._from_position_heightAdjusted, this._from.target);
        this._dir_from = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), this._from_position_heightAdjusted, this._from.target));

        this._h_to = this._to.position[2] - this._to.target[2];
        this._to_position_heightAdjusted = vec3.fromValues(this._to.position[0], this._to.position[1], this._to.target[2]);
        this._r_to = vec3.distance(this._to_position_heightAdjusted, this._to.target);
        this._dir_to = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), this._to_position_heightAdjusted, this._to.target));

        if (this._dir_from[0] === 0 && this._dir_from[1] === 0 && this._dir_from[2] === 0)
            this._dir_from = vec3.fromValues(1,0,0);

        if (this._dir_to[0] === 0 && this._dir_to[1] === 0 && this._dir_to[2] === 0)
            this._dir_to = vec3.fromValues(1,0,0);

        this._lorr = vec3.cross(vec3.create(), this._dir_to, this._dir_from);
        // This is why people hate JavaScript. The dot product of two normalized vector is larger than 1 on occasion due to precision errors...
        let dot1 = Math.min(1, Math.max(-1, vec3.dot(this._dir_to, this._dir_from))); 
        let dot2 = Math.min(1, Math.max(-1, vec3.dot(this._lorr, vec3.fromValues(0, 0, 1)))); 
        this._shortest_angle = dot2 > 0 ? -Math.acos(dot1) : Math.acos(dot1);
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        let positionOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._to.position[0], this._to.position[1], this._to.position[2]), this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
        let targetOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._to.target[0], this._to.target[1], this._to.target[2]), this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        let t = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.target, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.target, vec3.fromValues(value.delta, value.delta, value.delta)));
        let targetOffset = vec3.subtract(vec3.create(), t, this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);

        let angle = this._shortest_angle * value.delta;
        let dir = vec3.transformQuat(vec3.create(), this._dir_from, quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), angle));
        

        let scalar = this._r_from * (1 - value.delta) + this._r_to * value.delta;
        let p = vec3.add(vec3.create(), t, vec3.multiply(vec3.create(), dir, vec3.fromValues(scalar, scalar, scalar)));
        vec3.add(p, p, vec3.fromValues(0, 0, (this._h_from * (1 - value.delta) + this._h_to * value.delta)));

        let positionOffset = vec3.subtract(vec3.create(), p, this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
    }

    // #endregion Public Methods (3)
}