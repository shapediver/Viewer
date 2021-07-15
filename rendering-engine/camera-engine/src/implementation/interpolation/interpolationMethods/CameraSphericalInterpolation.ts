import { mat4, quat, vec3 } from 'gl-matrix'

import { ICamera } from '../../../interfaces/camera/ICamera'
import { ICameraControlsUsage } from '../../../interfaces/controls/ICameraControlsUsage'
import { ICameraInterpolation } from '../../../interfaces/interpolation/ICameraInterpolation'

export class CameraSphericalInterpolation implements ICameraInterpolation {
    // #region Properties (6)

    private _axis: vec3;
    private _c_angle: number;
    private _direction_from: vec3;
    private _direction_to: vec3;
    private _radius_from: number;
    private _radius_to: number;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(
        private readonly _camera: ICamera,
        private readonly _cameraControls: ICameraControlsUsage,
        private readonly _from: { position: vec3, target: vec3 },
        private readonly _to: { position: vec3, target: vec3 })
    {
        this._radius_from = vec3.distance(this._from.position, this._from.target);
        this._direction_from = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), this._from.position, this._from.target));
        
        this._radius_to = vec3.distance(this._to.position, this._to.target);
        this._direction_to = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), this._to.position, this._to.target));

        this._axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this._direction_to, this._direction_from));
        this._c_angle = -Math.acos(Math.min(1, Math.max(-1, vec3.dot(this._direction_to, this._direction_from))));
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
        let t: vec3 = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.target, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.target, vec3.fromValues(value.delta, value.delta, value.delta)));
        let targetOffset = vec3.subtract(vec3.create(), t, this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);

        let angle = this._c_angle * value.delta;
        let dir = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), this._direction_from, quat.setAxisAngle(quat.create(), this._axis, angle)));

        let scalar = (this._radius_from * (1 - value.delta) + this._radius_to * value.delta);
        let p: vec3 = vec3.add(vec3.create(), t, vec3.multiply(vec3.create(), dir, vec3.fromValues(scalar, scalar, scalar)));
        let positionOffset = vec3.subtract(vec3.create(), p, this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
    }

    // #endregion Public Methods (3)
}