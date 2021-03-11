import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CAMERATYPE, AbstractCamera as Camera, ICameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractLight as Light, AmbientLight, DirectionalLight, HemisphereLight, ILightEngine, PointLight, SpotLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { UuidGenerator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export enum RENDERERTYPE {
  THREEJS = 'threejs'
}
export class Viewer implements ILightEngine, ICameraEngine {
  // #region Properties (25)

  private readonly _renderingEngine: RenderingEngine;
  private readonly _uuidGenerator: UuidGenerator = container.resolve(UuidGenerator);

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
  private _groundPlaneVisibility: boolean = true;
  private _lightHelper: boolean = false;
  private _lightScene: string = 'default';
  private _pointSize: number = 1.0;
  private _shadows: boolean = true;
  private _show: boolean = false;
  private _showSceneTransition: number = 1000;

  // #endregion Properties (25)

  // #region Constructors (1)

  constructor(private readonly _id: string, type: RENDERERTYPE, canvas: HTMLCanvasElement) {
    this._renderingEngine = new RenderingEngineThreejs(this._id, canvas);
    container.registerInstance(this._id, this._renderingEngine);

    // default camera
    const camera = this.createCamera(CAMERATYPE.PERSPECTIVE);
    this.assignCamera(camera.id);

    // default light scene
    this.createLightScene(this._lightScene, true);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (42)

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
   * Getter groundPlaneVisibility
   * @return {boolean}
   */
  public get groundPlaneVisibility(): boolean {
    return this._groundPlaneVisibility;
  }

  /**
   * Setter groundPlaneVisibility
   * @param {boolean} value
   */
  public set groundPlaneVisibility(value: boolean) {
    this._groundPlaneVisibility = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
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
    return (<RenderingEngineThreejs>this._renderingEngine);
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

  // #endregion Public Accessors (42)

  // #region Public Methods (11)

  public assignCamera(id: string): void {
    (<RenderingEngineThreejs>this._renderingEngine).cameraEngine.assignCamera(id);
  }

  public createCamera(type: CAMERATYPE, id?: string): Camera {
    return (<RenderingEngineThreejs>this._renderingEngine).cameraEngine.createCamera(type, id);
  }

  public getCamera(id: string): Camera {
    return (<RenderingEngineThreejs>this._renderingEngine).cameraEngine.getCamera(id);
  }

  public getCameras(): { [key: string]: Camera } {
    return (<RenderingEngineThreejs>this._renderingEngine).cameraEngine.getCameras();
  }




  

  public addAmbientLight(color: vec3, intensity: number, id?: string): AmbientLight {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.addAmbientLight(color, intensity, id);
  }

  public addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, id?: string): DirectionalLight {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.addDirectionalLight(color, intensity, direction, castShadow, id);
  }

  public addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, id?: string): HemisphereLight {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.addHemisphereLight(color, intensity, groundColor, id);
  }

  public addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, id?: string): PointLight {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.addPointLight(color, intensity, position, distance, decay, id);
  }

  public addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, id?: string): SpotLight {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.addSpotLight(color, intensity, position, target, distance, decay, angle, penumbra, id);
  }

  public createLightScene(id?: string, standard?: boolean): string {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.createLightScene(id, standard);
  }

  public removeLightScene(id: string): boolean {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.removeLightScene(id);
  }

  public getLightScene(): string {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.getLightScene();
  }

  public getLightScenes(): string[] {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.getLightScenes();
  }

  public removeLight(id: string): boolean {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.removeLight(id);
  }

  public assignLightScene(id: string): boolean {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.assignLightScene(id);
  }

  public getLight(id: string): Light {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.getLight(id);
  }

  public getLights(): { [key: string]: Light } {
    return (<RenderingEngineThreejs>this._renderingEngine).lightEngine.getLights();
  }


  // #endregion Public Methods (11)
}