import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CAMERATYPE, AbstractCamera as Camera, ICameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractLight as Light, AmbientLight, DirectionalLight, HemisphereLight, ILightEngine, PointLight, SpotLight } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export enum RENDERERTYPE {
  THREEJS = 'threejs'
}

let _id: string;
export class Viewer implements ILightEngine, ICameraEngine {
  // #region Properties (25)


  // #endregion Properties (25)

  // #region Constructors (1)

  constructor(_idIn: string, type: RENDERERTYPE, canvas: HTMLCanvasElement) {
    _id = _idIn;
    const renderingEngine = new RenderingEngineThreejs(_id, canvas);
    container.registerInstance(_id, renderingEngine);

    // default camera
    const camera = this.createCamera(CAMERATYPE.PERSPECTIVE);
    this.assignCamera(camera.id);

    // default light scene
    this.createLightScene(renderingEngine.lightScene, true);

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
    return (<RenderingEngineThreejs>container.resolve(_id)).ambientOcclusion;
  }

  /**
   * Setter ambientOcclusion
   * @param {boolean} value
   */
  public set ambientOcclusion(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).ambientOcclusion = value;
  }

  /**
   * Getter beautyRenderDelay
   * @return {number}
   */
  public get beautyRenderDelay(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).beautyRenderDelay;
  }

  /**
   * Setter beautyRenderDelay
   * @param {number} value
   */
  public set beautyRenderDelay(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).beautyRenderDelay = value;
  }

  /**
   * Getter blurSceneWhenBusy
   * @return {boolean}
   */
  public get blurSceneWhenBusy(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).blurSceneWhenBusy;
  }

  /**
   * Setter blurSceneWhenBusy
   * @param {boolean} value
   */
  public set blurSceneWhenBusy(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).blurSceneWhenBusy = value;
  }

  /**
   * Getter clearAlpha
   * @return {number}
   */
  public get clearAlpha(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).clearAlpha;
  }

  /**
   * Setter clearAlpha
   * @param {number} value
   */
  public set clearAlpha(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).clearAlpha = value;
  }

  /**
   * Getter clearColor
   * @return {string}
   */
  public get clearColor(): string {
    return (<RenderingEngineThreejs>container.resolve(_id)).clearColor;
  }

  /**
   * Setter clearColor
   * @param {string} value
   */
  public set clearColor(value: string) {
    (<RenderingEngineThreejs>container.resolve(_id)).clearColor = value;
  }

  /**
   * Getter duration
   * @return {number}
   */
  public get duration(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).duration;
  }

  /**
   * Setter duration
   * @param {number} value
   */
  public set duration(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).duration = value;
  }

  /**
   * Getter environmentMap
   * @return {string}
   */
  public get environmentMap(): string {
    return (<RenderingEngineThreejs>container.resolve(_id)).environmentMap;
  }

  /**
   * Setter environmentMap
   * @param {string} value
   */
  public set environmentMap(value: string) {
    (<RenderingEngineThreejs>container.resolve(_id)).environmentMap = value;
  }

  /**
   * Getter environmentMapAsBackground
   * @return {boolean}
   */
  public get environmentMapAsBackground(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).environmentMapAsBackground;
  }

  /**
   * Setter environmentMapAsBackground
   * @param {boolean} value
   */
  public set environmentMapAsBackground(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).environmentMapAsBackground = value;
  }

  /**
   * Getter environmentMapResolution
   * @return {string}
   */
  public get environmentMapResolution(): string {
    return (<RenderingEngineThreejs>container.resolve(_id)).environmentMapResolution;
  }

  /**
   * Setter environmentMapResolution
   * @param {string} value
   */
  public set environmentMapResolution(value: string) {
    (<RenderingEngineThreejs>container.resolve(_id)).environmentMapResolution = value;
  }

  /**
   * Getter fullscreen
   * @return {boolean}
   */
  public get fullscreen(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).fullscreen;
  }

  /**
   * Setter fullscreen
   * @param {boolean} value
   */
  public set fullscreen(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).fullscreen = value;
  }

  /**
   * Getter gridVisibility
   * @return {boolean}
   */
  public get gridVisibility(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).gridVisibility;
  }

  /**
   * Setter gridVisibility
   * @param {boolean} value
   */
  public set gridVisibility(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).gridVisibility = value;
  }

  /**
   * Getter groundPlaneReflectionThreshold
   * @return {number}
   */
  public get groundPlaneReflectionThreshold(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneReflectionThreshold;
  }

  /**
   * Setter groundPlaneReflectionThreshold
   * @param {number} value
   */
  public set groundPlaneReflectionThreshold(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneReflectionThreshold = value;
  }

  /**
   * Getter groundPlaneReflectionVisibility
   * @return {boolean}
   */
  public get groundPlaneReflectionVisibility(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneReflectionVisibility;
  }

  /**
   * Setter groundPlaneReflectionVisibility
   * @param {boolean} value
   */
  public set groundPlaneReflectionVisibility(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneReflectionVisibility = value;
  }

  /**
   * Getter groundPlaneVisibility
   * @return {boolean}
   */
  public get groundPlaneVisibility(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneVisibility;
  }

  /**
   * Setter groundPlaneVisibility
   * @param {boolean} value
   */
  public set groundPlaneVisibility(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).groundPlaneVisibility = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return _id;
  }

  /**
   * Getter lightHelper
   * @return {boolean}
   */
  public get lightHelper(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).lightHelper;
  }

  /**
   * Setter lightHelper
   * @param {boolean} value
   */
  public set lightHelper(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).lightHelper = value;
  }

  /**
   * Getter lightScene
   * @return {string}
   */
  public get lightScene(): string {
    return (<RenderingEngineThreejs>container.resolve(_id)).lightScene;
  }

  /**
   * Setter lightScene
   * @param {string} value
   */
  public set lightScene(value: string) {
    (<RenderingEngineThreejs>container.resolve(_id)).lightScene = value;
  }

  /**
   * Getter pointSize
   * @return {number}
   */
  public get pointSize(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).pointSize;
  }

  /**
   * Setter pointSize
   * @param {number} value
   */
  public set pointSize(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).pointSize = value;
  }

  /**
   * Getter shadows
   * @return {boolean}
   */
  public get shadows(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).shadows;
  }

  /**
   * Setter shadows
   * @param {boolean} value
   */
  public set shadows(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).shadows = value;
  }

  /**
   * Getter show
   * @return {boolean}
   */
  public get show(): boolean {
    return (<RenderingEngineThreejs>container.resolve(_id)).show;
  }

  /**
   * Setter show
   * @param {boolean} value
   */
  public set show(value: boolean) {
    (<RenderingEngineThreejs>container.resolve(_id)).show = value;
  }

  /**
   * Getter showSceneTransition
   * @return {number}
   */
  public get showSceneTransition(): number {
    return (<RenderingEngineThreejs>container.resolve(_id)).showSceneTransition;
  }

  /**
   * Setter showSceneTransition
   * @param {number} value
   */
  public set showSceneTransition(value: number) {
    (<RenderingEngineThreejs>container.resolve(_id)).showSceneTransition = value;
  }

  // #endregion Public Accessors (42)

  // #region Public Methods (11)


  public update(): void {
    (<RenderingEngineThreejs>container.resolve(_id)).updateSceneTree();
  }


  public assignCamera(id: string): void {
    (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).cameraEngine.assignCamera(id);
  }

  public createCamera(type: CAMERATYPE, id?: string): Camera {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).cameraEngine.createCamera(type, id);
  }

  public getCamera(id: string): Camera {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).cameraEngine.getCamera(id);
  }

  public getCameras(): { [key: string]: Camera } {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).cameraEngine.getCameras();
  }




  

  public addAmbientLight(color: vec3, intensity: number, id?: string): AmbientLight {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.addAmbientLight(color, intensity, id);
  }

  public addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, id?: string): DirectionalLight {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.addDirectionalLight(color, intensity, direction, castShadow, id);
  }

  public addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, id?: string): HemisphereLight {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.addHemisphereLight(color, intensity, groundColor, id);
  }

  public addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, id?: string): PointLight {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.addPointLight(color, intensity, position, distance, decay, id);
  }

  public addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, id?: string): SpotLight {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.addSpotLight(color, intensity, position, target, distance, decay, angle, penumbra, id);
  }

  public createLightScene(id?: string, standard?: boolean): string {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.createLightScene(id, standard);
  }

  public removeLightScene(id: string): boolean {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.removeLightScene(id);
  }

  public getLightScene(): string {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.getLightScene();
  }

  public getLightScenes(): string[] {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.getLightScenes();
  }

  public removeLight(id: string): boolean {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.removeLight(id);
  }

  public assignLightScene(id: string): boolean {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.assignLightScene(id);
  }

  public getLight(id: string): Light {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.getLight(id);
  }

  public getLights(): { [key: string]: Light } {
    return (<RenderingEngineThreejs>(<RenderingEngineThreejs>container.resolve(_id))).lightEngine.getLights();
  }

  // #endregion Public Methods (11)
}