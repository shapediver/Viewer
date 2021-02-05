import { vec3, mat4 } from 'gl-matrix';
import { singleton, container } from 'tsyringe';

import { ISetting } from '../../interfaces/ISetting';
import { BooleanSetting } from '../types/BooleanSetting';
import { CustomSetting } from '../types/CustomSetting';
import { NumberSetting } from '../types/NumberSetting';
import { OrbitControlsSettings } from './OrbitControlsSettings';
import { OrthographicControlsSettings } from './OrthographicControlsSettings';

@singleton()
export class CameraSettings {
  // #region Properties (13)

  private readonly _orbitControls: OrbitControlsSettings = <OrbitControlsSettings>container.resolve(OrbitControlsSettings);
  private readonly _orthographicControls: OrthographicControlsSettings = <OrthographicControlsSettings>container.resolve(OrthographicControlsSettings);

  private _activeType: ISetting<number> = new NumberSetting(0, 'Set camera type', (value: number) => value >= 0 && value <= 6);
  private _autoAdjust: ISetting<boolean> = new BooleanSetting(false, 'Enable / disable that the camera adjusts to geometry updates');
  private _cameraMovementDuration: ISetting<number> = new NumberSetting(800, 'Default duration of camera movements', (value: number) => value > 0);
  private _enableCameraControls: ISetting<boolean> = new BooleanSetting(true, 'Enable / disable camera controls');
  private _fov: ISetting<number> = new NumberSetting(45, 'Camera frustum vertical field of view angle, unit degree, interval [0,180]', (value: number) => value > 0 && value < 180);
  private _matrix: ISetting<mat4> = new CustomSetting(mat4.create());
  private _orthographicCameraDefinition: ISetting<{ position: vec3, target: vec3 }> = new CustomSetting({ position: vec3.create(), target: vec3.create() }, 'Default position and target for the orthographic camera')
  private _perspectiveCameraDefinition: ISetting<{ position: vec3, target: vec3 }> = new CustomSetting({ position: vec3.create(), target: vec3.create() }, 'Default position and target for the perspective camera')
  private _perspectiveControls: ISetting<number> = new NumberSetting(0, 'Set camera control type', (value: number) => value === 0 || value === 1);
  private _revertAtMouseUp: ISetting<boolean> = new BooleanSetting(false, 'Enable / disable if the mouse should reset on mouse up');
  private _revertAtMouseUpDuration: ISetting<number> = new NumberSetting(800, 'The duration of the transition of the revertAtMouseUp', (value: number) => value > 0);
  private _zoomExtentsFactor: ISetting<number> = new NumberSetting(1, 'Factor to apply to the bounding box before zooming to extents', (value: number) => value > 0);

  // #endregion Properties (13)

  // #region Public Accessors (24)

  /**
   * Getter activeType
   * @return {ISetting<number>}
   */
  public get activeType(): ISetting<number> {
    return this._activeType;
  }

  /**
   * Setter activeType
   * @param {ISetting<number>} value
   */
  public set activeType(value: ISetting<number>) {
    this._activeType = value;
  }

  /**
   * Getter autoAdjust
   * @return {ISetting<boolean>}
   */
  public get autoAdjust(): ISetting<boolean> {
    return this._autoAdjust;
  }

  /**
   * Setter autoAdjust
   * @param {ISetting<boolean>} value
   */
  public set autoAdjust(value: ISetting<boolean>) {
    this._autoAdjust = value;
  }

  /**
   * Getter cameraMovementDuration
   * @return {ISetting<number>}
   */
  public get cameraMovementDuration(): ISetting<number> {
    return this._cameraMovementDuration;
  }

  /**
   * Setter cameraMovementDuration
   * @param {ISetting<number>} value
   */
  public set cameraMovementDuration(value: ISetting<number>) {
    this._cameraMovementDuration = value;
  }

  /**
   * Getter enableCameraControls
   * @return {ISetting<boolean>}
   */
  public get enableCameraControls(): ISetting<boolean> {
    return this._enableCameraControls;
  }

  /**
   * Setter enableCameraControls
   * @param {ISetting<boolean>} value
   */
  public set enableCameraControls(value: ISetting<boolean>) {
    this._enableCameraControls = value;
  }

  /**
   * Getter fov
   * @return {ISetting<number>}
   */
  public get fov(): ISetting<number> {
    return this._fov;
  }

  /**
   * Setter fov
   * @param {ISetting<number>} value
   */
  public set fov(value: ISetting<number>) {
    this._fov = value;
  }

  /**
   * Getter matrix
   * @return {ISetting<mat4>}
   */
  public get matrix(): ISetting<mat4> {
    return this._matrix;
  }

  /**
   * Setter matrix
   * @param {ISetting<mat4>} value
   */
  public set matrix(value: ISetting<mat4>) {
    this._matrix = value;
  }

  /**
   * Getter orbitControls
   * @return {OrbitControlsSettings}
   */
  public get orbitControls(): OrbitControlsSettings {
    return this._orbitControls;
  }

  /**
   * Getter orthographicCameraDefinition
   * @return {ISetting<{ position: vec3, target: vec3 }>}
   */
  public get orthographicCameraDefinition(): ISetting<{ position: vec3, target: vec3 }> {
    return this._orthographicCameraDefinition;
  }

  /**
   * Setter orthographicCameraDefinition
   * @param {ISetting<{ position: vec3, target: vec3 }>} value
   */
  public set orthographicCameraDefinition(value: ISetting<{ position: vec3, target: vec3 }>) {
    this._orthographicCameraDefinition = value;
  }

  /**
   * Getter orthographicControls
   * @return {OrthographicControlsSettings}
   */
  public get orthographicControls(): OrthographicControlsSettings {
    return this._orthographicControls;
  }

  /**
   * Getter perspectiveCameraDefinition
   * @return {ISetting<{ position: vec3, target: vec3 }>}
   */
  public get perspectiveCameraDefinition(): ISetting<{ position: vec3, target: vec3 }> {
    return this._perspectiveCameraDefinition;
  }

  /**
   * Setter perspectiveCameraDefinition
   * @param {ISetting<{ position: vec3, target: vec3 }>} value
   */
  public set perspectiveCameraDefinition(value: ISetting<{ position: vec3, target: vec3 }>) {
    this._perspectiveCameraDefinition = value;
  }

  /**
   * Getter perspectiveControls
   * @return {ISetting<number>}
   */
  public get perspectiveControls(): ISetting<number> {
    return this._perspectiveControls;
  }

  /**
   * Setter perspectiveControls
   * @param {ISetting<number>} value
   */
  public set perspectiveControls(value: ISetting<number>) {
    this._perspectiveControls = value;
  }

  /**
   * Getter revertAtMouseUp
   * @return {ISetting<boolean>}
   */
  public get revertAtMouseUp(): ISetting<boolean> {
    return this._revertAtMouseUp;
  }

  /**
   * Setter revertAtMouseUp
   * @param {ISetting<boolean>} value
   */
  public set revertAtMouseUp(value: ISetting<boolean>) {
    this._revertAtMouseUp = value;
  }

  /**
   * Getter revertAtMouseUpDuration
   * @return {ISetting<number>}
   */
  public get revertAtMouseUpDuration(): ISetting<number> {
    return this._revertAtMouseUpDuration;
  }

  /**
   * Setter revertAtMouseUpDuration
   * @param {ISetting<number>} value
   */
  public set revertAtMouseUpDuration(value: ISetting<number>) {
    this._revertAtMouseUpDuration = value;
  }

  /**
   * Getter zoomExtentsFactor
   * @return {ISetting<number>}
   */
  public get zoomExtentsFactor(): ISetting<number> {
    return this._zoomExtentsFactor;
  }

  /**
   * Setter zoomExtentsFactor
   * @param {ISetting<number>} value
   */
  public set zoomExtentsFactor(value: ISetting<number>) {
    this._zoomExtentsFactor = value;
  }

  // #endregion Public Accessors (24)
}