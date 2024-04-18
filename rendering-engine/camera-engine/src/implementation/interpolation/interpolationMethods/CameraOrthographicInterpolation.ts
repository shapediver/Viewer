import { ICamera } from '../../../interfaces/camera/ICamera';
import { ICameraControls } from '../../../interfaces/controls/ICameraControls';
import { ICameraInterpolation } from '../../../interfaces/interpolation/ICameraInterpolation';
import { vec3 } from 'gl-matrix';

export class CameraOrthographicInterpolation implements ICameraInterpolation {
    // #region Constructors (1)

    constructor(
        private readonly _camera: ICamera,
        private readonly _cameraControls: ICameraControls,
        private readonly _from: { position: vec3, target: vec3 },
        private readonly _to: { position: vec3, target: vec3 }) {
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        const positionOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._to.position[0], this._to.position[1], this._to.position[2]), this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
        const targetOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._to.target[0], this._to.target[1], this._to.target[2]), this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        const t: vec3 = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.target, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.target, vec3.fromValues(value.delta, value.delta, value.delta)));
        const targetOffset = vec3.subtract(vec3.create(), t, this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);

        const p: vec3 = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.position, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.position, vec3.fromValues(value.delta, value.delta, value.delta)));
        const positionOffset = vec3.subtract(vec3.create(), p, this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
    }

    // #endregion Public Methods (3)
}