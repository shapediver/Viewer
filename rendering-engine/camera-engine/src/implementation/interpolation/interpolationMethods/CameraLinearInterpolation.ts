import { mat4, vec3 } from "gl-matrix";
import { ICamera } from "../../../interfaces/camera/ICamera";
import { ICameraControlsUsage } from "../../../interfaces/controls/ICameraControlsUsage";
import { ICameraInterpolation } from "../../../interfaces/interpolation/ICameraInterpolation";

export class CameraLinearInterpolation implements ICameraInterpolation {
    // #region Constructors (1)

    constructor(
        private readonly _camera: ICamera, 
        private readonly _cameraControls: ICameraControlsUsage, 
        private readonly _from: { position: vec3, target: vec3 }, 
        private readonly _to: { position: vec3, target: vec3 }) 
    {
    }
    // #endregion Constructors (1)

    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        let positionOffset = vec3.subtract(vec3.create(), this._to.position, this._camera.position);
        const translateMatP = mat4.fromTranslation(mat4.create(), positionOffset);
        this._cameraControls.applyPositionMatrix(translateMatP);
        let targetOffset = vec3.subtract(vec3.create(), this._to.target, this._camera.target);
        const translateMatT = mat4.fromTranslation(mat4.create(), targetOffset);
        this._cameraControls.applyTargetMatrix(translateMatT);
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        let p = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.position, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.position, vec3.fromValues(value.delta, value.delta, value.delta)));
        let positionOffset = vec3.subtract(vec3.create(), p, this._camera.position);
        const translateMatP = mat4.fromTranslation(mat4.create(), positionOffset);
        this._cameraControls.applyPositionMatrix(translateMatP);

        let t = vec3.add(vec3.create(), vec3.multiply(vec3.create(), this._from.target, vec3.fromValues(1 - value.delta, 1 - value.delta, 1 - value.delta)), vec3.multiply(vec3.create(), this._to.target, vec3.fromValues(value.delta, value.delta, value.delta)));
        let targetOffset = vec3.subtract(vec3.create(), t, this._camera.target);
        const translateMatT = mat4.fromTranslation(mat4.create(), targetOffset);
        this._cameraControls.applyTargetMatrix(translateMatT);
    }

    // #endregion Public Methods (3)
}