import { mat4, vec3 } from 'gl-matrix'

import { ICamera } from '../../../interfaces/camera/ICamera'
import { ICameraControlsUsage } from '../../../interfaces/controls/ICameraControlsUsage'
import { ICameraInterpolation } from '../../../interfaces/interpolation/ICameraInterpolation'

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

    constructor(
        private readonly _camera: ICamera, 
        private readonly _cameraControls: ICameraControlsUsage, 
        private readonly _path: { position: vec3, target: vec3 }[],
        private readonly _interpolationFunction: Function)
    {
        for(let i = 0; i < this._path.length; i++) {
            this.end.position.x.push(this._path[i].position[0]);
            this.end.position.y.push(this._path[i].position[1]);
            this.end.position.z.push(this._path[i].position[2]);
            this.end.target.x.push(this._path[i].target[0]);
            this.end.target.y.push(this._path[i].target[1]);
            this.end.target.z.push(this._path[i].target[2]);
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public onComplete(value: { delta: number }): void {
        let positionOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._path[this._path.length-1].position[0], this._path[this._path.length-1].position[1], this._path[this._path.length-1].position[2]), this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);
        let targetOffset = vec3.subtract(vec3.create(), vec3.fromValues(this._path[this._path.length-1].target[0], this._path[this._path.length-1].target[1], this._path[this._path.length-1].target[2]), this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);
    }

    public onStop(value: { delta: number }): void {
    }

    public onUpdate(value: { delta: number }): void {
        let p: vec3 = vec3.fromValues(this._interpolationFunction(this.end.position.x, value.delta), this._interpolationFunction(this.end.position.y, value.delta), this._interpolationFunction(this.end.position.z, value.delta));
        let positionOffset = vec3.subtract(vec3.create(), p, this._cameraControls.getPositionWithUpdates());
        this._cameraControls.applyPositionVector(positionOffset);

        let t: vec3 = vec3.fromValues(this._interpolationFunction(this.end.target.x, value.delta), this._interpolationFunction(this.end.target.y, value.delta), this._interpolationFunction(this.end.target.z, value.delta));
        let targetOffset = vec3.subtract(vec3.create(), t, this._cameraControls.getTargetWithUpdates());
        this._cameraControls.applyTargetVector(targetOffset);
    }

    // #endregion Public Methods (3)
}