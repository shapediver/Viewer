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
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import { Box, IBox, Plane } from '@shapediver/viewer.shared.math'
import { IPerspectiveCameraSettingsV3 } from '@shapediver/viewer.settings'
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree'

import { CAMERA_TYPE } from '../../interfaces/ICameraEngine'
import { AbstractCamera } from './AbstractCamera'
import { PerspectiveCameraControls } from '../controls/PerspectiveCameraControls'
import { IPerspectiveCamera } from '../../interfaces/camera/IPerspectiveCamera'
import { IPerspectiveCameraControls } from '../../interfaces/controls/IPerspectiveCameraControls'

export class PerspectiveCamera extends AbstractCamera implements IPerspectiveCamera {
  // #region Properties (3)

  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #tree: ITree = <ITree>container.resolve(Tree);

  protected _controls: IPerspectiveCameraControls;

  #domEventListenerToken?: string;
  #domEventEngine?: DomEventEngine;

  #aspect: number | undefined;
  #fov: number = 60;
  #threeJsObject: { [key: string]: THREE.PerspectiveCamera } = {};

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(id: string) {
    super(id, CAMERA_TYPE.PERSPECTIVE);
    this._controls = new PerspectiveCameraControls(this, true);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (4)

  public get aspect(): number | undefined {
    return this.#aspect;
  }

  public set aspect(value: number | undefined) {
    this.#aspect = value;
  }

  public get controls(): IPerspectiveCameraControls {
    return this._controls;
  }

  public set controls(value: IPerspectiveCameraControls) {
    this._controls = value;
  }

  public get fov(): number {
    return this.#fov;
  }

  public set fov(value: number) {
    this.#fov = value;
  }

  public get threeJsObject(): { [key: string]: THREE.PerspectiveCamera } {
    return this.#threeJsObject;
  }

  // #endregion Public Accessors (4)

  // #region Public Methods (6)

  public applySettings(settingsEngine: SettingsEngine) {
    const cameraSetting = <IPerspectiveCameraSettingsV3>settingsEngine.camera.cameras[this.id];
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
      this.fov = cameraSetting.fov;
    }

    if (this.position[0] === this.target[0] && this.position[1] === this.target[1] && this.position[2] === this.target[2]) {
      if(this._viewportId) {
        this._stateEngine.renderingEngines[this._viewportId].boundingBoxCreated.then(async () => {
          await this.zoomTo(undefined, { duration: 0 });
          this.defaultPosition = vec3.clone(this._controls.position);
          this.defaultTarget = vec3.clone(this._controls.target);
        })      
      }
    }
    (<PerspectiveCameraControls>this._controls).applySettings(settingsEngine);
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
    this.#domEventListenerToken = this.#domEventEngine.addDomEventListener((<PerspectiveCameraControls>this._controls).cameraControlsEventDistribution);

    this.boundingBox = this.#tree.root.boundingBox.clone();

    this._stateEngine.renderingEngines[viewportId].boundingBoxCreated.then(async () => {
      if (this.position[0] === this.target[0] && this.position[1] === this.target[1] && this.position[2] === this.target[2])
        await this.zoomTo(undefined, { duration: 0 });
    })
  }

  public clone(): IPerspectiveCamera {
    return new PerspectiveCamera(this.id);
  }

  public calculateZoomTo(zoomTarget?: Box, startingPosition: vec3 = this.position, startingTarget: vec3 = this.target): { position: vec3, target: vec3 } {
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

    const samePosition = startingPosition[0] === startingTarget[0] && startingPosition[1] === startingTarget[1] && startingPosition[2] === startingTarget[2];
    let target = vec3.fromValues((box.max[0] + box.min[0]) / 2, (box.max[1] + box.min[1]) / 2, (box.max[2] + box.min[2]) / 2);

    // if the camera position and the target are the same, we set a corner position
    if (startingPosition[0] === startingTarget[0] && startingPosition[1] === startingTarget[1] && startingPosition[2] === startingTarget[2])
      startingPosition = vec3.fromValues(target[0], target[1] - 7.5, target[2] + 5);

    // extend box by the factor
    const boxDir = vec3.subtract(vec3.create(), box.max, target)
    vec3.multiply(boxDir, boxDir, samePosition ? vec3.fromValues(2, 2, 2) : vec3.fromValues(this.zoomExtentsFactor, this.zoomExtentsFactor, this.zoomExtentsFactor));
    box = new Box(vec3.subtract(vec3.create(), target, boxDir), vec3.add(vec3.create(), target, boxDir))

    const direction = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), target, startingPosition));

    let cross = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.fromValues(0, 0, 1), direction));
    let up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), cross, direction));

    let position = vec3.add(vec3.create(), target, vec3.multiply(vec3.create(), direction, vec3.fromValues(-0.00000001, -0.00000001, -0.00000001)));

    let points = [];
    points.push(vec3.fromValues(box.min[0], box.min[1], box.min[2]));
    points.push(vec3.fromValues(box.min[0], box.min[1], box.max[2]));
    points.push(vec3.fromValues(box.min[0], box.max[1], box.min[2]));
    points.push(vec3.fromValues(box.min[0], box.max[1], box.max[2]));
    points.push(vec3.fromValues(box.max[0], box.min[1], box.min[2]));
    points.push(vec3.fromValues(box.max[0], box.min[1], box.max[2]));
    points.push(vec3.fromValues(box.max[0], box.max[1], box.min[2]));
    points.push(vec3.fromValues(box.max[0], box.max[1], box.max[2]));

    let fovDown = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), direction, quat.setAxisAngle(quat.create(), cross, (this.fov / 2) * (Math.PI / 180))));
    let fovUp = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), direction, quat.setAxisAngle(quat.create(), cross, -(this.fov / 2) * (Math.PI / 180))));

    const aspect = samePosition ? 1.5 : this.aspect || 1.5;
    let hFoV = 2 * Math.atan(Math.tan(this.fov * Math.PI / 180 / 2) * aspect);
    let fovRight = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), direction, quat.setAxisAngle(quat.create(), up, hFoV / 2)));
    let fovLeft = vec3.normalize(vec3.create(), vec3.transformQuat(vec3.create(), direction, quat.setAxisAngle(quat.create(), up, -hFoV / 2)));

    let planeCross = new Plane(vec3.clone(cross), 0);
    planeCross.setFromNormalAndCoplanarPoint(vec3.clone(cross), vec3.clone(target));

    let planeUp = new Plane(vec3.fromValues(0, 0, 1), 0);
    planeUp.setFromNormalAndCoplanarPoint(vec3.clone(up), vec3.clone(target));

    let distanceCamera = 0.0;
    for (let i = 0; i < points.length; i++) {
      let projected = planeCross.clampPoint(points[i]);
      let toP = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), projected, position));

      if (vec3.dot(direction, fovDown) > vec3.dot(direction, toP)) {
        const currentDir = vec3.multiply(vec3.create(), vec3.dot(fovDown, toP) > vec3.dot(fovUp, toP) ? fovDown : fovUp, vec3.fromValues(-1, -1, -1));
        const distance = planeUp.intersect(projected, currentDir)
        if (distance) {
          const cameraPoint = vec3.add(vec3.create(), vec3.multiply(vec3.create(), currentDir, vec3.fromValues(distance, distance, distance)), projected);
          distanceCamera = Math.max(distanceCamera, vec3.distance(target, cameraPoint));
        }
      }

      projected = planeUp.clampPoint(points[i]);
      toP = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), projected, position));

      if (vec3.dot(direction, fovRight) > vec3.dot(direction, toP)) {
        const currentDir = vec3.multiply(vec3.create(), vec3.dot(fovRight, toP) > vec3.dot(fovLeft, toP) ? fovRight : fovLeft, vec3.fromValues(-1, -1, -1));
        const distance = planeCross.intersect(projected, currentDir)
        if (distance) {
          const cameraPoint = vec3.add(vec3.create(), vec3.multiply(vec3.create(), currentDir, vec3.fromValues(distance, distance, distance)), projected);
          distanceCamera = Math.max(distanceCamera, vec3.distance(target, cameraPoint));
        }
      }
    }

    position = vec3.add(vec3.create(), target, vec3.multiply(vec3.create(), direction, vec3.fromValues(-distanceCamera, -distanceCamera, -distanceCamera)));

    return {
      position, target
    }
  }

  public project(pos: vec3, position = this.position, target = this.target): vec2 {
    const m = mat4.targetTo(mat4.create(), position, target, vec3.fromValues(0, 0, 1));
    const aspect = this.aspect || 1.5;
    const p = mat4.perspective(mat4.create(), this.fov / (180 / Math.PI), aspect, this.near, this.far);
    vec3.transformMat4(pos, pos, mat4.invert(m, m))
    vec3.transformMat4(pos, pos, p)
    return vec2.fromValues(pos[0], pos[1])
  }

  public unproject(pos: vec3, position = this.position, target = this.target): vec3 {
    const m = mat4.targetTo(mat4.create(), position, target, vec3.fromValues(0, 0, 1));
    const aspect = this.aspect || 1.5;
    const p = mat4.perspective(mat4.create(), this.fov / (180 / Math.PI), aspect, this.near, this.far);
    vec3.transformMat4(pos, pos, mat4.invert(p, p))
    vec3.transformMat4(pos, pos, m)
    return vec3.clone(pos);
  }

  // #endregion Public Methods (6)
}