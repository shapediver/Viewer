import {
  Converter,
  DomEventEngine,
  Logger,
  LOGGING_TOPIC,
  SettingsEngine,
  ShapeDiverViewerCameraError,
  StateEngine,
} from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { mat4, vec2, vec3 } from 'gl-matrix'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import { IOrthographicCameraSettingsV3 } from '@shapediver/viewer.settings'
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree'

import { CAMERA_TYPE } from '../../interfaces/ICameraEngine'
import { AbstractCamera } from './AbstractCamera'
import { OrthographicCameraControls } from '../controls/OrthographicCameraControls'
import { IOrthographicCamera, ORTHOGRAPHIC_CAMERA_DIRECTION } from '../../interfaces/camera/IOrthographicCamera'
import { IOrthographicCameraControls } from '../../interfaces/controls/IOrthographicCameraControls'

export class OrthographicCamera extends AbstractCamera implements IOrthographicCamera {
  // #region Properties (7)

  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #tree: ITree = <ITree>container.resolve(Tree);

  #domEventListenerToken?: string;
  #domEventEngine?: DomEventEngine;

  #bottom: number = -100;
  #direction: ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
  #left: number = -100;
  #right: number = 100;
  #top: number = 100;
  #threeJsObject: { [key: string]: THREE.OrthographicCamera } = {};
  #up: vec3 = vec3.fromValues(0, 1, 0);
  protected _controls: IOrthographicCameraControls;

  // #endregion Properties (7)

  // #region Constructors (1)

  constructor(id: string) {
    super(id, CAMERA_TYPE.ORTHOGRAPHIC);
    this._controls = new OrthographicCameraControls(this, true);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (12)

  public get bottom(): number {
    return this.#bottom;
  }

  public set bottom(value: number) {
    this.#bottom = value;
  }

  public get controls(): IOrthographicCameraControls {
    return this._controls;
  }

  public set controls(value: IOrthographicCameraControls) {
    this._controls = value;
  }

  public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
    return this.#direction;
  }

  public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
    const changedDirection = this.#direction !== value;

    this.#direction = value;
    switch (this.#direction) {
      case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
      case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
        this.up = vec3.fromValues(0, 1, 0);
        break;
      case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
        this.up = vec3.fromValues(0, 0, 1);
        break;
      case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
        this.up = vec3.fromValues(0, 0, 1);
        break;
      case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
        this.up = vec3.fromValues(0, 0, 1);
        break;
      case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
        this.up = vec3.fromValues(0, 0, 1);
        break;
      default:
        this.up = vec3.fromValues(0, -1, 0);
    }

    if (changedDirection) {
      const { position, target } = this.calculateZoomTo(undefined);
      this.defaultPosition = vec3.clone(position);
      this.defaultTarget = vec3.clone(target);
      
      this.position = vec3.clone(position);
      this.target = vec3.clone(target);
    }
  }

  public get left(): number {
    return this.#left;
  }

  public set left(value: number) {
    this.#left = value;
  }

  public get right(): number {
    return this.#right;
  }

  public set right(value: number) {
    this.#right = value;
  }

  public get top(): number {
    return this.#top;
  }

  public set top(value: number) {
    this.#top = value;
  }

  public get up(): vec3 {
    return this.#up;
  }

  public set up(value: vec3) {
    this.#up = value;
  }

  public get threeJsObject(): { [key: string]: THREE.OrthographicCamera } {
    return this.#threeJsObject;
  }

  // #endregion Public Accessors (12)

  // #region Public Methods (6)

  public applySettings(settingsEngine: SettingsEngine) {
    const cameraSetting = <IOrthographicCameraSettingsV3>settingsEngine.camera.cameras[this.id];
    if (cameraSetting) {
      this.name = cameraSetting.name;
      this.autoAdjust = cameraSetting.autoAdjust;
      this.cameraMovementDuration = cameraSetting.cameraMovementDuration;
      this.enableCameraControls = cameraSetting.enableCameraControls;
      this.revertAtMouseUp = cameraSetting.revertAtMouseUp;
      this.revertAtMouseUpDuration = cameraSetting.revertAtMouseUpDuration;
      this.zoomExtentsFactor = cameraSetting.zoomExtentsFactor;

      let position = this.#converter.toVec3(cameraSetting.position);
      let target = this.#converter.toVec3(cameraSetting.target);
      this.defaultPosition = vec3.clone(position);
      this.defaultTarget = vec3.clone(target);

      this.position = position;
      this.target = target;
    }

    if (this.position[0] === this.target[0] && this.position[1] === this.target[1] && this.position[2] === this.target[2]) {
      if (this._viewportId) {
        this._stateEngine.renderingEngines[this._viewportId].boundingBoxCreated
          .then(async () => {
            await this.zoomTo(undefined, { duration: 0 });
            this.defaultPosition = vec3.clone(this._controls.position);
            this.defaultTarget = vec3.clone(this._controls.target);
          })
      }
    }
    (<OrthographicCameraControls>this._controls).applySettings(settingsEngine);
  }

  public assignViewer(viewportId: string): void {
    const renderingEngines = (<IRenderingEngine[]>container.resolveAll('renderingEngine'));
    let renderingEngine: IRenderingEngine | undefined = renderingEngines.find(r => r.id === viewportId && r.closed === false);
    if(!renderingEngine) {
      const error = new ShapeDiverViewerCameraError(`OrthographicCamera(${this.id}).assignViewer: Viewer with id ${viewportId} not found.`);
      throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `OrthographicCamera(${this.id}).assignViewer`, error);
    }

    this.assignViewerInternal(viewportId, renderingEngine.canvas);
    this._controls.assignViewer(viewportId, renderingEngine.canvas);

    if (this.#domEventListenerToken && this.#domEventEngine)
      this.#domEventEngine.removeDomEventListener(this.#domEventListenerToken);

    this.#domEventEngine = renderingEngine.domEventEngine;
    this.#domEventListenerToken = this.#domEventEngine.addDomEventListener((<OrthographicCameraControls>this._controls).cameraControlsEventDistribution);

    this.boundingBox = this.#tree.root.boundingBox.clone();
      
    this._stateEngine.renderingEngines[viewportId].boundingBoxCreated.then(async () => {
      if (this.position[0] === this.target[0] && this.position[1] === this.target[1] && this.position[2] === this.target[2])
        await this.zoomTo(undefined, { duration: 0 });
    })
  }

  public clone(): IOrthographicCamera {
    return new OrthographicCamera(this.id);
  }

  public calculateZoomTo(zoomTarget?: Box, startingPosition: vec3 = this.position, startingTarget: vec3 = this.target): { position: vec3; target: vec3; } {
    let box: IBox;

    // Part 1 - calculate the bounding box that we should zoom to
    if (!zoomTarget) {
      // complete scene
      box = this._boundingBox.clone();
    } else {
      // specified Box
      box = zoomTarget.clone();
    }
    
    if (box.isEmpty()) return { position: vec3.create(), target: vec3.create() }

    const factor = 2 * box.boundingSphere.radius * this.zoomExtentsFactor;
    const center = vec3.clone(box.boundingSphere.center);

    switch (this.#direction) {
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

  public unproject(pos: vec3, position = this.position, target = this.target): vec3 {
    const m = mat4.targetTo(mat4.create(), this.position, this.target, this.up);
    const p = mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);
    vec3.transformMat4(pos, pos, mat4.invert(p, p))
    vec3.transformMat4(pos, pos, m)
    return vec3.clone(pos);
  }

  // #endregion Public Methods (6)
}