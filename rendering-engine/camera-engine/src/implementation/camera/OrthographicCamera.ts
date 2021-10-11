import { SettingsEngine, StateEngine, Converter } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { mat4, vec2, vec3 } from 'gl-matrix'
import { Box } from '@shapediver/viewer.shared.math'

import { CAMERATYPE } from '../../interfaces/ICameraEngine'
import { AbstractCamera } from './AbstractCamera'
import { OrthographicCameraControls } from '../controls/OrthographicCameraControls'
import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '../../interfaces/camera/IOrthographicCamera'
import { IOrthographicCameraSettingsV3 } from '@shapediver/viewer.settings'

export class OrthographicCamera extends AbstractCamera {
   // #region Properties (5)

   private readonly _converter: Converter = <Converter>container.resolve(Converter);

   private _bottom: number = 100;
   private _left: number = 100;
   private _right: number = 100;
   private _top: number = 100;
   private _up: vec3 = vec3.fromValues(0, 1, 0);
   private _direction: ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;

   // #endregion Properties (5)

   // #region Constructors (1)

   constructor(viewerId: string, id: string, canvas: HTMLCanvasElement) {
      super(viewerId, id, canvas, CAMERATYPE.ORTHOGRAPHIC);
      this._controls = new OrthographicCameraControls(viewerId, this, canvas, true);
   }

   // #endregion Constructors (1)

   // #region Public Accessors (8)

   public get bottom(): number {
      return this._bottom;
   }

   public set bottom(value: number) {
      this._bottom = value;
   }

   public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
      return this._direction;
   }

   public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
      const changedDirection = this._direction !== value;

      this._direction = value;
      switch (this._direction) {
         case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
         case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
            this.up = vec3.fromValues(0,1,0);
            break;
         case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
            this.up = vec3.fromValues(0,0,1);
            break;
         case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
            this.up = vec3.fromValues(0,0,1);
            break;
         case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
            this.up = vec3.fromValues(0,0,1);
            break;
         case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
            this.up = vec3.fromValues(0,0,1);
            break;
         default:
            this.up = vec3.fromValues(0,-1,0);
      }
      
      if(changedDirection) {
         const { position, target } = this.getZoomPositionAndTarget(undefined);
         this.defaultPosition = vec3.clone(position);
         this.defaultTarget = vec3.clone(target);
      }
   }

   public get left(): number {
      return this._left;
   }

   public set left(value: number) {
      this._left = value;
   }

   public get right(): number {
      return this._right;
   }

   public set right(value: number) {
      this._right = value;
   }

   public get top(): number {
      return this._top;
   }

   public set top(value: number) {
      this._top = value;
   }

   public get up(): vec3 {
      return this._up;
   }

   public set up(value: vec3) {
      this._up = value;
   }

   // #endregion Public Accessors (8)

   // #region Public Methods (3)

   public applySettings() {
      const cameraSetting = <IOrthographicCameraSettingsV3>this._settingsEngine.camera.cameras[this.id];
      if(cameraSetting) {
         this.autoAdjust = cameraSetting.autoAdjust;
         this.cameraMovementDuration = cameraSetting.cameraMovementDuration;
         this.enableCameraControls = cameraSetting.enableCameraControls;
         this.revertAtMouseUp = cameraSetting.revertAtMouseUp;
         this.revertAtMouseUpDuration = cameraSetting.revertAtMouseUpDuration;
         this.zoomExtentsFactor = cameraSetting.zoomExtentsFactor;
   
         let position = this._converter.toVec3(cameraSetting.position);
         let target = this._converter.toVec3(cameraSetting.target);
         this.defaultPosition = vec3.clone(position);
         this.defaultTarget = vec3.clone(target);
   
         this.position = position;
         this.target = target;
      }

      if (this.position[0] === this.target[0] && this.position[1] === this.target[1] && this.position[2] === this.target[2]) {
         this._stateEngine.boundingBoxCreated.then(async () => {
            await this.zoomTo(undefined, { duration: 0 });
            this.defaultPosition = vec3.clone(this._controls.position);
            this.defaultTarget = vec3.clone(this._controls.target);
         })
      }
      (<OrthographicCameraControls>this._controls).applySettings();
   }

   public getZoomPositionAndTarget(zoomTarget?: Box): { position: vec3; target: vec3; } {
      let box: Box;

      // Part 1 - calculate the bounding box that we should zoom to
      if (!zoomTarget) {
         // complete scene
         box = this._boundingBox.clone();
      } else {
         // specified Box
         box = zoomTarget.clone();
      }

      const factor = 2 * box.boundingSphere.radius * this.zoomExtentsFactor;

      const center = vec3.clone(box.boundingSphere.center);
      switch (this._direction) {
         case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
            return {
               position: vec3.fromValues(center[0], center[1], center[2] + factor),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
            return {
               position: vec3.fromValues(center[0], center[1], center[2] - factor),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
            return {
               position: vec3.fromValues(center[0] + factor, center[1], center[2]),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
            return {
               position: vec3.fromValues(center[0] - factor, center[1], center[2]),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
            return {
               position: vec3.fromValues(center[0], center[1] + factor, center[2]),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
            return {
               position: vec3.fromValues(center[0], center[1] - factor, center[2]),
               target: vec3.clone(center)
            }
         default:
            return {
               position: vec3.fromValues(center[0], center[1], center[2] + factor),
               target: vec3.clone(center)
            }
      }
   }

   public project(pos: vec3): vec2 {
      const m = mat4.targetTo(mat4.create(), this.position, this.target, this.up);
      const p = mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);
      vec3.transformMat4(pos, pos, mat4.invert(m, m))
      vec3.transformMat4(pos, pos, p)
      return vec2.fromValues(pos[0], pos[1])
   }

   // #endregion Public Methods (3)
}