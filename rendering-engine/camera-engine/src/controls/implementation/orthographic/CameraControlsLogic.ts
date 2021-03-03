import { mat4, vec3 } from 'gl-matrix';
import * as THREE from 'three';
import { ICameraControlsLogic } from '../../interface/ICameraControlsLogic';
import { OrthographicCameraControls } from '../../..';

export class CameraControlsLogic implements ICameraControlsLogic {
    // #region Properties (16)

    private _adjustedSettings = {
        damping: () => this._controls.damping * this._settingsAdjustments.damping,
        movementSmoothness: () => this._controls.movementSmoothness * this._settingsAdjustments.movementSmoothness,
        panSpeed: () => this._controls.panSpeed * this._settingsAdjustments.panSpeed,
        zoomSpeed: () => this._controls.zoomSpeed * this._settingsAdjustments.zoomSpeed,
    };
    private _damping: any = {
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
            offset: new THREE.Vector3()
        },
    };
    private _dollyDelta = 0;
    private _dollyEnd = 0;
    private _dollyStart = 0;
    private _panDelta = new THREE.Vector2();
    private _panEnd = new THREE.Vector2();
    private _panStart = new THREE.Vector2();
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

    constructor(private readonly _controls: OrthographicCameraControls) {}

    // #endregion Constructors (1)

    // #region Public Methods (7)

    public isWithinRestrictions(position: any, target: any): boolean {
        return true;
    }

    public pan(x: any, y: any, active: boolean, touch: boolean): void {
        if (touch) {
            x = x / window.devicePixelRatio;
            y = y / window.devicePixelRatio;
          }
      
          if (!active) {
            this._panStart.set(x, y);
          } else {
            this._panEnd.set(x, y);
            this._panDelta.subVectors(this._panEnd, this._panStart);
            if (this._panDelta.x === 0 && this._panDelta.y === 0) return;
            this._panStart.copy(this._panEnd);
      
            let offset = this.panDeltaToOffset(this._panDelta.multiplyScalar(this._adjustedSettings.panSpeed() * (touch ? this._touchAdjustments.panSpeed : 1.0)));
      
            if (this._damping.pan.duration > 0) {
              if (offset.x < 0) {
                offset.x = Math.min(offset.x, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.x);
              } else {
                offset.x = Math.max(offset.x, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.x);
              }
              if (offset.y < 0) {
                offset.y = Math.min(offset.y, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.y);
              } else {
                offset.y = Math.max(offset.y, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.y);
              }
              if (offset.z < 0) {
                offset.z = Math.min(offset.z, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.z);
              } else {
                offset.z = Math.max(offset.z, this._adjustedSettings.movementSmoothness() * this._damping.pan.offset.z);
              }
            }
      
            let damping = 1 - Math.max(0.01, Math.min(0.99, this._adjustedSettings.damping()));
            let framesOffsetX = (Math.log(1 / Math.abs(offset.x)) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetY = (Math.log(1 / Math.abs(offset.y)) - 5 * Math.log(10)) / (Math.log(damping));
            let framesOffsetZ = (Math.log(1 / Math.abs(offset.z)) - 5 * Math.log(10)) / (Math.log(damping));
            this._damping.pan.time = 0;
            this._damping.pan.duration = Math.max(framesOffsetX, Math.max(framesOffsetY, framesOffsetZ)) * 16.6666;
            this._damping.pan.offset = offset.clone();
      
            this._damping.zoom.duration = 0;

            this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
            this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
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
              offset: new THREE.Vector3()
            },
          };
          this._dollyDelta = 0;
          this._dollyEnd = 0;
          this._dollyStart = 0;
          this._panDelta = new THREE.Vector2();
          this._panEnd = new THREE.Vector2();
          this._panStart = new THREE.Vector2();
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
              let offset = this._damping.pan.offset.clone().multiplyScalar(Math.pow(damping, frameSinceStart));
      
                this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
                this._controls.applyPositionMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)));
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

      
              let dir = new THREE.Vector3(),
                offset = new THREE.Vector3();
              dir.copy(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).normalize();
              offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates()).clone().add(dir.multiplyScalar(newDistance)));
              offset.sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
              this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
      
            }
        } else {
            this._damping.zoom.time = 0;
        }
    }

    public zoom(x: any, y: any, active: boolean, touch: boolean): void {
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
    
          let newDistance = this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()).distanceTo(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates()))
            * (1 - delta);
    
          let dir = new THREE.Vector3(),
            offset = new THREE.Vector3();
          dir.copy(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).normalize();
          offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates()).clone().add(dir.multiplyScalar(newDistance)));
          offset.sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
            this._controls.applyTargetMatrix(this.convertThreeMatrixToGlMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z)), true);
        }
    }

    // #endregion Public Methods (7)

    // #region Private Methods (7)

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

    private panDeltaToOffset(panDelta: THREE.Vector2): THREE.Vector3 {
        let offset = new THREE.Vector3();
        let panOffset = new THREE.Vector3();
    
        // perspective
        offset.copy(this.convertGlVectorToThreeVector(this._controls.getPositionWithManualUpdates())).sub(this.convertGlVectorToThreeVector(this._controls.getTargetWithManualUpdates()));
    
        // // we use only clientHeight here so aspect ratio does not distort speed
        // // left
        // let v1 = new THREE.Vector3();
        // v1.setFromMatrixColumn(this._controls.camera.matrix, 0); // get X column of objectMatrix
        // v1.multiplyScalar(-(panDelta.x * (this._controls.camera.right - this._controls.camera.left) * 0.5 / this._controls.camera.zoom));
        // panOffset.add(v1);
    
        // // up
        // let v = new THREE.Vector3();
        // v.setFromMatrixColumn(this._controls.camera.matrix, 1); // get Y column of objectMatrix
        // v.multiplyScalar(panDelta.y * (this._controls.camera.right - this._controls.camera.left) * 0.5 / this._controls.camera.zoom);
        // panOffset.add(v);
    
        return panOffset.clone();
    }

    // #endregion Private Methods (7)
};