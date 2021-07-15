import { mat4, vec2, vec3 } from 'gl-matrix'

import { OrthographicCameraControls } from '../../..'
import { ICameraControlsLogic } from '../../../interfaces/controls/ICameraControlsLogic'
import { OrthographicCamera } from '../../camera/OrthographicCamera'

export class CameraControlsLogic implements ICameraControlsLogic {
  // #region Properties (16)

  private _adjustedSettings = {
    damping: () => this._controls.damping * this._settingsAdjustments.damping,
    movementSmoothness: () => this._controls.movementSmoothness * this._settingsAdjustments.movementSmoothness,
    panSpeed: () => this._controls.panSpeed * this._settingsAdjustments.panSpeed,
    zoomSpeed: () => this._controls.zoomSpeed * this._settingsAdjustments.zoomSpeed,
  };
  private _damping = {
    rotation: {
      time: 0,
      duration: 0,
      theta: 0,
      phi: 0
    },
    zoom: {
      time: 0,
      duration: 0,
      delta: 0
    },
    pan: {
      time: 0,
      duration: 0,
      offset: vec3.create()
    },
  };
  private _dollyDelta = 0;
  private _dollyEnd = 0;
  private _dollyStart = 0;
  private _panDelta = vec2.create();
  private _panEnd = vec2.create();
  private _panStart = vec2.create();
  private _settingsAdjustments = {
    damping: 1.0,
    movementSmoothness: 1.0,
    panSpeed: 2.0,
    zoomSpeed: 0.025,
  };
  private _touchAdjustments = {
    damping: 1.0,
    movementSmoothness: 1.0,
    panSpeed: 2.0,
    zoomSpeed: 50.0,
  };

  // #endregion Properties (16)

  // #region Constructors (1)

  constructor(private readonly _controls: OrthographicCameraControls) { }

  // #endregion Constructors (1)

  // #region Public Methods (7)

  public isWithinRestrictions(position: vec3, target: vec3): boolean {
    return true;
  }

  public pan(x: number, y: number, active: boolean, touch: boolean): void {
    if (touch) {
      x = x / window.devicePixelRatio;
      y = y / window.devicePixelRatio;
    }

    if (!active) {
      this._panStart = vec2.fromValues(x, y);
    } else {
      this._panEnd = vec2.fromValues(x, y);
      vec2.sub(this._panDelta, this._panEnd, this._panStart);
      if (this._panDelta[0] === 0 && this._panDelta[1] === 0) return;
      vec2.copy(this._panStart, this._panEnd);

      const adjustedPanSpeed = this._adjustedSettings.panSpeed() * (touch ? this._touchAdjustments.panSpeed : 1.0);
      let offset = this.panDeltaToOffset(vec2.mul(vec2.create(), this._panDelta, vec2.fromValues(adjustedPanSpeed, adjustedPanSpeed)));

      if (this._damping.pan.duration > 0) {
        if (offset[0] < 0) {
          offset[0] = Math.min(offset[0], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[0]);
        } else {
          offset[0] = Math.max(offset[0], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[0]);
        }
        if (offset[1] < 0) {
          offset[1] = Math.min(offset[1], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[1]);
        } else {
          offset[1] = Math.max(offset[1], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[1]);
        }
        if (offset[2] < 0) {
          offset[2] = Math.min(offset[2], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[2]);
        } else {
          offset[2] = Math.max(offset[2], this._adjustedSettings.movementSmoothness() * this._damping.pan.offset[2]);
        }
      }

      let damping = 1 - Math.max(0.01, Math.min(0.99, this._adjustedSettings.damping()));

      let framesOffsetX = (Math.log(1 / Math.abs(offset[0])) - 5 * Math.log(10)) / (Math.log(damping));
      let framesOffsetY = (Math.log(1 / Math.abs(offset[1])) - 5 * Math.log(10)) / (Math.log(damping));
      let framesOffsetZ = (Math.log(1 / Math.abs(offset[2])) - 5 * Math.log(10)) / (Math.log(damping));
      this._damping.pan.time = 0;
      this._damping.pan.duration = Math.max(framesOffsetX, Math.max(framesOffsetY, framesOffsetZ)) * 16.6666;
      this._damping.pan.offset = vec3.clone(offset);

      this._damping.rotation.duration = 0;
      this._damping.zoom.duration = 0;

      this._controls.applyTargetVector(offset, true);
      this._controls.applyPositionVector(offset, true);
    }
  }

  public reset() {
    this._damping = {
      rotation: {
        time: 0,
        duration: 0,
        theta: 0,
        phi: 0
      },
      zoom: {
        time: 0,
        duration: 0,
        delta: 0
      },
      pan: {
        time: 0,
        duration: 0,
        offset: vec3.create()
      },
    };
    this._dollyDelta = 0;
    this._dollyEnd = 0;
    this._dollyStart = 0;
    this._panDelta = vec2.create();
    this._panEnd = vec2.create();
    this._panStart = vec2.create();
  }

  public restrict(p: vec3, t: vec3): { position: vec3, target: vec3 } {
    return {
      position: p,
      target: t
    };
  }

  public update(time: number, manualInteraction: boolean): void {
    if (manualInteraction === true) {
      this._damping.zoom.duration = 0;
      this._damping.pan.duration = 0;
    }


    let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));

    if (this._damping.pan.duration > 0) {
      if (this._damping.pan.time + time > this._damping.pan.duration) {
        this._damping.pan.time = this._damping.pan.duration;
        this._damping.pan.duration = 0;
      } else {
        this._damping.pan.time += time;

        let frameSinceStart = this._damping.pan.time / 16.6666;
        let dampingFrames = Math.pow(damping, frameSinceStart);
        let offset = vec3.multiply(vec3.create(), this._damping.pan.offset, vec3.fromValues(dampingFrames, dampingFrames, dampingFrames));
        this._controls.applyTargetVector(offset);
        this._controls.applyPositionVector(offset);
      }
    } else {
      this._damping.pan.time = 0;
    }

    if (this._damping.zoom.duration > 0) {
      if (this._damping.zoom.time + time > this._damping.zoom.duration) {
        this._damping.zoom.time = this._damping.zoom.duration;
        this._damping.zoom.duration = 0;
      } else {
        this._damping.zoom.time += time;

        let frameSinceStart = this._damping.zoom.time / 16.6666;
        let delta = this._damping.zoom.delta * Math.pow(damping, frameSinceStart);

        let newDistance = vec3.distance(this._controls.getTargetWithManualUpdates(), this._controls.getPositionWithManualUpdates())
          * (1 - delta);


        let dir = vec3.create(),
          offset = vec3.create();
        vec3.normalize(dir, vec3.subtract(dir, this._controls.getTargetWithManualUpdates(), this._controls.getPositionWithManualUpdates()));
        vec3.add(offset, this._controls.getPositionWithManualUpdates(), vec3.multiply(offset, dir, vec3.fromValues(newDistance, newDistance, newDistance)))
        vec3.subtract(offset, offset, this._controls.getTargetWithManualUpdates())
        this._controls.applyTargetVector(offset, true);

      }
    } else {
      this._damping.zoom.time = 0;
    }
  }

  public zoom(x: number, y: number, active: boolean, touch: boolean): void {
    var distance = Math.sqrt(x * x + y * y);
    if (touch)
      distance = distance / window.devicePixelRatio;

    if (!active) {
      this._dollyStart = distance;
    } else {
      this._dollyEnd = distance;
      this._dollyDelta = this._dollyEnd - this._dollyStart;
      this._dollyStart = this._dollyEnd;

      if (this._damping.zoom.duration > 0) {
        if (this._dollyDelta < 0) {
          this._dollyDelta = Math.min(this._dollyDelta, this._adjustedSettings.movementSmoothness() * this._damping.zoom.delta);
        } else {
          this._dollyDelta = Math.max(this._dollyDelta, this._adjustedSettings.movementSmoothness() * this._damping.zoom.delta);
        }
      }
      let delta = this._dollyDelta * this._adjustedSettings.zoomSpeed() * (touch ? this._touchAdjustments.zoomSpeed : 1.0);

      let damping = 1 - Math.max(0.01, Math.min(1, this._adjustedSettings.damping()));
      let framesDelta = (Math.log(1 / Math.abs(this._dollyDelta)) - 5 * Math.log(10)) / (Math.log(damping));
      this._damping.zoom.time = 0;
      this._damping.zoom.duration = framesDelta * 16.6666;
      this._damping.zoom.delta = delta;

      this._damping.pan.duration = 0;


      let newDistance = vec3.distance(this._controls.getTargetWithManualUpdates(), this._controls.getPositionWithManualUpdates())
        * (1 - delta);

      let dir = vec3.create(),
        offset = vec3.create();
      vec3.normalize(dir, vec3.subtract(dir, this._controls.getTargetWithManualUpdates(), this._controls.getPositionWithManualUpdates()));
      vec3.add(offset, this._controls.getPositionWithManualUpdates(), vec3.multiply(offset, dir, vec3.fromValues(newDistance, newDistance, newDistance)))
      vec3.subtract(offset, offset, this._controls.getTargetWithManualUpdates())
      this._controls.applyTargetVector(offset, true);
    }
  }

  // #endregion Public Methods (7)

  // #region Private Methods (7)

  private panDeltaToOffset(panDelta: vec2): vec3 {
    let offset = vec3.create();
    let panOffset = vec3.create();

    // perspective
    vec3.subtract(offset, this._controls.getPositionWithManualUpdates(), this._controls.getTargetWithManualUpdates())

    const orthographicCamera: OrthographicCamera = <OrthographicCamera>this._controls.camera;
    const mat = mat4.targetTo(mat4.create(), orthographicCamera.position, orthographicCamera.target, orthographicCamera.up);

    // // we use only clientHeight here so aspect ratio does not distort speed
    // // left
    const v1 = vec3.fromValues(mat[0], mat[1], mat[2]);
    const scalar1 = -(panDelta[0] * (orthographicCamera.right - orthographicCamera.left) * 0.5 / 1 /** orthographicCamera.zoom */);
    vec3.multiply(v1, v1, vec3.fromValues(scalar1, scalar1, scalar1));
    vec3.add(panOffset, panOffset, v1);

    // // up
    const v2 = vec3.fromValues(mat[4], mat[5], mat[6]);
    const scalar2 = panDelta[1] * (orthographicCamera.right - orthographicCamera.left) * 0.5 / 1 /** orthographicCamera.zoom */;
    vec3.multiply(v2, v2, vec3.fromValues(scalar2, scalar2, scalar2));
    vec3.add(panOffset, panOffset, v2);

    return vec3.clone(panOffset);
  }

  // #endregion Private Methods (7)
};