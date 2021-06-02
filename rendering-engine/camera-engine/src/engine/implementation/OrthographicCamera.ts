import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { mat4, vec2, vec3 } from "gl-matrix";
import { OrthographicCameraControls } from "../../controls/implementation/OrthographicCameraControls";
import { Box } from "@shapediver/viewer.shared.math";

enum ORTHOGRAPHIC_DIRECTION {
   TOP = 'top',
   BOTTOM = 'bottom',
   LEFT = 'left',
   RIGHT = 'right',
   FRONT = 'front',
   BACK = 'back',
}
export class OrthographicCamera extends AbstractCamera {
   // #region Properties (5)

   private readonly _converter: Converter = <Converter>container.resolve(Converter);

   private _bottom: number = 100;
   private _left: number = 100;
   private _right: number = 100;
   private _top: number = 100;
   private _direction: ORTHOGRAPHIC_DIRECTION = ORTHOGRAPHIC_DIRECTION.TOP;

   // #endregion Properties (5)

   // #region Constructors (1)

   constructor(id: string, _canvas: HTMLCanvasElement) {
      super(id, CAMERATYPE.ORTHOGRAPHIC);
      this._controls = new OrthographicCameraControls(this, _canvas, true);
   }

   // #endregion Constructors (1)

   // #region Public Accessors (8)

   /**
      * Getter bottom
      * @return {number }
      */
   public get bottom(): number {
      return this._bottom;
   }

   /**
      * Setter bottom
      * @param {number } value
      */
   public set bottom(value: number) {
      this._bottom = value;
   }

   /**
      * Getter left
      * @return {number }
      */
   public get left(): number {
      return this._left;
   }

   /**
      * Setter left
      * @param {number } value
      */
   public set left(value: number) {
      this._left = value;
   }

   /**
      * Getter right
      * @return {number }
      */
   public get right(): number {
      return this._right;
   }

   /**
      * Setter right
      * @param {number } value
      */
   public set right(value: number) {
      this._right = value;
   }

   /**
      * Getter top
      * @return {number }
      */
   public get top(): number {
      return this._top;
   }

   /**
      * Setter top
      * @param {number } value
      */
   public set top(value: number) {
      this._top = value;
   }

   // #endregion Public Accessors (8)

   // #region Public Methods (3)

   public applySettings() {
      this.autoAdjust = this._settingsEngine.camera.autoAdjust.value;
      this.cameraMovementDuration = this._settingsEngine.camera.cameraMovementDuration.value;
      this.enableCameraControls = this._settingsEngine.camera.enableCameraControls.value;
      this.revertAtMouseUp = this._settingsEngine.camera.revertAtMouseUp.value;
      this.revertAtMouseUpDuration = this._settingsEngine.camera.revertAtMouseUpDuration.value;
      this.zoomExtentsFactor = this._settingsEngine.camera.zoomExtentsFactor.value;

      let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position);
      let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target);
      this.defaultPosition = vec3.clone(position);
      this.defaultTarget = vec3.clone(target);

      this.position = position;
      this.target = target;

      if (vec3.equals(position, target)) {
         this._stateEngine.boundingBoxCreated.then(async () => {
            await this.zoomTo([], { duration: 0 });
            this.defaultPosition = vec3.clone(this._controls.position);
            this.defaultTarget = vec3.clone(this._controls.target);
         })
      }
      (<OrthographicCameraControls>this._controls).applySettings();
   }

   public getZoomPositionAndTarget(zoomTarget?: Box | string[]): { position: vec3; target: vec3; } {
      let box: Box;

      // Part 1 - calculate the bounding box that we should zoom to
      if (!zoomTarget) {
         // complete scene
         box = this._boundingBox.clone();
      } else if (zoomTarget instanceof Box) {
         // specified Box
         box = zoomTarget;
      } else {
         // scene paths https://shapediver.atlassian.net/browse/SS-2951
         box = this._boundingBox.clone();
      }

      const factor = 2 * box.boundingSphere.radius * this.zoomExtentsFactor;

      const center = vec3.clone(box.boundingSphere.center);
      const eps = 0.001;
      switch (this._direction) {
         case ORTHOGRAPHIC_DIRECTION.TOP:
            return {
               position: vec3.fromValues(center[0], center[1]-eps, center[2] + factor),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_DIRECTION.BOTTOM:
            return {
               position: vec3.fromValues(center[0], center[1]-eps, center[2] - factor),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_DIRECTION.RIGHT:
            return {
               position: vec3.fromValues(center[0] + factor, center[1], center[2]-eps),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_DIRECTION.LEFT:
            return {
               position: vec3.fromValues(center[0] - factor, center[1], center[2]-eps),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_DIRECTION.BACK:
            return {
               position: vec3.fromValues(center[0]-eps, center[1] + factor, center[2]),
               target: vec3.clone(center)
            }
         case ORTHOGRAPHIC_DIRECTION.FRONT:
            return {
               position: vec3.fromValues(center[0]-eps, center[1] - factor, center[2]),
               target: vec3.clone(center)
            }
         default:
            return {
               position: vec3.fromValues(center[0], center[1]-eps, center[2] + factor),
               target: vec3.clone(center)
            }
      }
   }

   public project(pos: vec3): vec2 {
      const m = mat4.targetTo(mat4.create(), this.position, this.target, vec3.fromValues(0, 0, 1));
      const p = mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);
      vec3.transformMat4(pos, pos, mat4.invert(m, m))
      vec3.transformMat4(pos, pos, p)
      return vec2.fromValues(pos[0], pos[1])
   }

   // #endregion Public Methods (3)
}