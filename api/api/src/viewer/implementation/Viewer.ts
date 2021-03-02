import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { container } from "tsyringe";
import { IViewer, RENDERERTYPE } from "../interfaces/IViewer";
import { AbstractCamera as Camera } from "./camera/AbstractCamera";
import { PerspectiveCamera } from "./camera/PerspectiveCamera";
import { CameraEngine, CAMERATYPE, ICameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";
import { OrthographicCamera } from "./camera/OrthographicCamera";
import { vec3 } from "gl-matrix";
import { UuidGenerator } from "../../../../../shared/services/node_modules/@shapediver/viewer.shared.utils/dist";

export class Viewer implements IViewer {
  // #region Properties (21)

  private readonly _renderingEngine: RenderingEngine;
  private readonly _uuidGenerator: UuidGenerator = container.resolve(UuidGenerator);
  private readonly _cameras: {
    [key: string]: {
      camera: Camera,
      engine: ICameraEngine
    } 
  } = {};

  private _ambientOcclusion: boolean = true;
  private _beautyRenderDelay: number = 50;
  private _blurSceneWhenBusy: boolean = true;
  private _clearAlpha: number = 1.0;
  private _clearColor: string = '#ffffff';
  private _duration: number = 0;
  private _environmentMap: string = 'none';
  private _environmentMapAsBackground: boolean = false;
  private _environmentMapResolution: string = '1024';
  private _fullscreen: boolean = false;
  private _gridVisibility: boolean = true;
  private _groundPlaneReflectionThreshold: number = 0.01;
  private _groundPlaneReflectionVisibility: boolean = false;
  private _lightHelper: boolean = false;
  private _lightScene: string = 'default';
  private _pointSize: number = 1.0;
  private _roundPlaneVisibility: boolean = true;
  private _shadows: boolean = true;
  private _show: boolean = false;
  private _showSceneTransition: number = 1000;

  // #endregion Properties (21)

  // #region Constructors (1)

  constructor(type: RENDERERTYPE, name: string, canvas: HTMLCanvasElement) {
    const renderingEngineThreejs = new RenderingEngineThreejs(name, canvas);
    container.registerInstance(name, renderingEngineThreejs);
    this._renderingEngine = renderingEngineThreejs;

    this.createCamera(CAMERATYPE.PERSPECTIVE);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (41)

  /**
   * Getter ambientOcclusion
   * @return {boolean}
   */
  public get ambientOcclusion(): boolean {
    return this._ambientOcclusion;
  }

  /**
   * Setter ambientOcclusion
   * @param {boolean} value
   */
  public set ambientOcclusion(value: boolean) {
    this._ambientOcclusion = value;
  }

  /**
   * Getter beautyRenderDelay
   * @return {number}
   */
  public get beautyRenderDelay(): number {
    return this._beautyRenderDelay;
  }

  /**
   * Setter beautyRenderDelay
   * @param {number} value
   */
  public set beautyRenderDelay(value: number) {
    this._beautyRenderDelay = value;
  }

  /**
   * Getter blurSceneWhenBusy
   * @return {boolean}
   */
  public get blurSceneWhenBusy(): boolean {
    return this._blurSceneWhenBusy;
  }

  /**
   * Setter blurSceneWhenBusy
   * @param {boolean} value
   */
  public set blurSceneWhenBusy(value: boolean) {
    this._blurSceneWhenBusy = value;
  }

  /**
   * Getter clearAlpha
   * @return {number}
   */
  public get clearAlpha(): number {
    return this._clearAlpha;
  }

  /**
   * Setter clearAlpha
   * @param {number} value
   */
  public set clearAlpha(value: number) {
    this._clearAlpha = value;
  }

  /**
   * Getter clearColor
   * @return {string}
   */
  public get clearColor(): string {
    return this._clearColor;
  }

  /**
   * Setter clearColor
   * @param {string} value
   */
  public set clearColor(value: string) {
    this._clearColor = value;
  }

  /**
   * Getter duration
   * @return {number}
   */
  public get duration(): number {
    return this._duration;
  }

  /**
   * Setter duration
   * @param {number} value
   */
  public set duration(value: number) {
    this._duration = value;
  }

  /**
   * Getter environmentMap
   * @return {string}
   */
  public get environmentMap(): string {
    return this._environmentMap;
  }

  /**
   * Setter environmentMap
   * @param {string} value
   */
  public set environmentMap(value: string) {
    this._environmentMap = value;
  }

  /**
   * Getter environmentMapAsBackground
   * @return {boolean}
   */
  public get environmentMapAsBackground(): boolean {
    return this._environmentMapAsBackground;
  }

  /**
   * Setter environmentMapAsBackground
   * @param {boolean} value
   */
  public set environmentMapAsBackground(value: boolean) {
    this._environmentMapAsBackground = value;
  }

  /**
   * Getter environmentMapResolution
   * @return {string}
   */
  public get environmentMapResolution(): string {
    return this._environmentMapResolution;
  }

  /**
   * Setter environmentMapResolution
   * @param {string} value
   */
  public set environmentMapResolution(value: string) {
    this._environmentMapResolution = value;
  }

  /**
   * Getter fullscreen
   * @return {boolean}
   */
  public get fullscreen(): boolean {
    return this._fullscreen;
  }

  /**
   * Setter fullscreen
   * @param {boolean} value
   */
  public set fullscreen(value: boolean) {
    this._fullscreen = value;
  }

  /**
   * Getter gridVisibility
   * @return {boolean}
   */
  public get gridVisibility(): boolean {
    return this._gridVisibility;
  }

  /**
   * Setter gridVisibility
   * @param {boolean} value
   */
  public set gridVisibility(value: boolean) {
    this._gridVisibility = value;
  }

  /**
   * Getter groundPlaneReflectionThreshold
   * @return {number}
   */
  public get groundPlaneReflectionThreshold(): number {
    return this._groundPlaneReflectionThreshold;
  }

  /**
   * Setter groundPlaneReflectionThreshold
   * @param {number} value
   */
  public set groundPlaneReflectionThreshold(value: number) {
    this._groundPlaneReflectionThreshold = value;
  }

  /**
   * Getter groundPlaneReflectionVisibility
   * @return {boolean}
   */
  public get groundPlaneReflectionVisibility(): boolean {
    return this._groundPlaneReflectionVisibility;
  }

  /**
   * Setter groundPlaneReflectionVisibility
   * @param {boolean} value
   */
  public set groundPlaneReflectionVisibility(value: boolean) {
    this._groundPlaneReflectionVisibility = value;
  }

  /**
   * Getter lightHelper
   * @return {boolean}
   */
  public get lightHelper(): boolean {
    return this._lightHelper;
  }

  /**
   * Setter lightHelper
   * @param {boolean} value
   */
  public set lightHelper(value: boolean) {
    this._lightHelper = value;
  }

  /**
   * Getter lightScene
   * @return {string}
   */
  public get lightScene(): string {
    return this._lightScene;
  }

  /**
   * Setter lightScene
   * @param {string} value
   */
  public set lightScene(value: string) {
    this._lightScene = value;
  }

  /**
   * Getter pointSize
   * @return {number}
   */
  public get pointSize(): number {
    return this._pointSize;
  }

  /**
   * Setter pointSize
   * @param {number} value
   */
  public set pointSize(value: number) {
    this._pointSize = value;
  }

  public get renderingEngine(): RenderingEngine {
    return this._renderingEngine;
  }

  /**
   * Getter roundPlaneVisibility
   * @return {boolean}
   */
  public get roundPlaneVisibility(): boolean {
    return this._roundPlaneVisibility;
  }

  /**
   * Setter roundPlaneVisibility
   * @param {boolean} value
   */
  public set roundPlaneVisibility(value: boolean) {
    this._roundPlaneVisibility = value;
  }

  /**
   * Getter shadows
   * @return {boolean}
   */
  public get shadows(): boolean {
    return this._shadows;
  }

  /**
   * Setter shadows
   * @param {boolean} value
   */
  public set shadows(value: boolean) {
    this._shadows = value;
  }

  /**
   * Getter show
   * @return {boolean}
   */
  public get show(): boolean {
    return this._show;
  }

  /**
   * Setter show
   * @param {boolean} value
   */
  public set show(value: boolean) {
    this._show = value;
  }

  /**
   * Getter showSceneTransition
   * @return {number}
   */
  public get showSceneTransition(): number {
    return this._showSceneTransition;
  }

  /**
   * Setter showSceneTransition
   * @param {number} value
   */
  public set showSceneTransition(value: number) {
    this._showSceneTransition = value;
  }

  // #endregion Public Accessors (41)

  // #region Public Methods (1)

  public createCamera(type?: CAMERATYPE): Camera {
    if(CAMERATYPE.ORTHOGRAPHIC === type) {
      const engine = new CameraEngine(this.renderingEngine.canvas.canvasElement, CAMERATYPE.ORTHOGRAPHIC);
      const cameraId = this._uuidGenerator.create();
      const camera = new OrthographicCamera(cameraId, engine);
      this._cameras[cameraId] = { camera, engine };
      this.assignCamera(camera);
      return camera;
    } else {
      const engine = new CameraEngine(this.renderingEngine.canvas.canvasElement, CAMERATYPE.PERSPECTIVE);
      const cameraId = this._uuidGenerator.create();
      const camera = new PerspectiveCamera(cameraId, engine);
      this._cameras[cameraId] = { camera, engine };
      this.assignCamera(camera);
      return camera;
    }
  }

  public assignCamera(camera: Camera): void {
    const cameraDef = this._cameras[camera.id];
    this._renderingEngine.cameraEngine = cameraDef.engine;
  }

  // #endregion Public Methods (1)
}