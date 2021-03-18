import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CAMERATYPE, ICameraEngine, PerspectiveCamera as PerspectiveCameraLogic, OrthographicCamera as OrthographicCameraLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractLight, ILightEngine, AmbientLight as AmbientLightLogic, DirectionalLight as DirectionalLightLogic, HemisphereLight as HemisphereLightLogic, PointLight as PointLightLogic, SpotLight as SpotLightLogic, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { vec3 } from "gl-matrix";
import { injectable } from "tsyringe";
import { Camera } from "./camera/Camera";
import { OrthographicCamera } from "./camera/OrthographicCamera";
import { PerspectiveCamera } from "./camera/PerspectiveCamera";
import { AmbientLight } from "./lights/AmbientLight";
import { DirectionalLight } from "./lights/DirectionalLight";
import { HemisphereLight } from "./lights/HemisphereLight";
import { Light } from "./lights/Light";
import { PointLight } from "./lights/PointLight";
import { SpotLight } from "./lights/SpotLight";

export enum RENDERERTYPE {
  THREEJS = 'threejs'
}

@injectable()
export class Viewer implements ILightEngine, ICameraEngine, IRenderingEngine {
  // #region Properties (25)
  readonly #renderingEngine: RenderingEngineThreejs;

  readonly #cameras: {
    [key: string]: Camera
  } = {};
  readonly #lights: {
    [key: string]: Light
  } = {};
  // #endregion Properties (25)

  // #region Constructors (1)

  constructor(id: string, type: RENDERERTYPE, canvas: HTMLCanvasElement) {
    this.#renderingEngine = new RenderingEngineThreejs(id, canvas);

    // default camera
    const camera = this.createCamera(CAMERATYPE.PERSPECTIVE);
    this.assignCamera(camera.id);

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
    return this.#renderingEngine.ambientOcclusion;
  }

  /**
   * Setter ambientOcclusion
   * @param {boolean} value
   */
  public set ambientOcclusion(value: boolean) {
    this.#renderingEngine.ambientOcclusion = value;
  }

  /**
   * Getter beautyRenderBlendingDuration
   * @return {number}
   */
  public get beautyRenderBlendingDuration(): number {
    return this.#renderingEngine.beautyRenderBlendingDuration;
  }

  /**
   * Setter beautyRenderBlendingDuration
   * @param {number} value
   */
  public set beautyRenderBlendingDuration(value: number) {
    this.#renderingEngine.beautyRenderBlendingDuration = value;
  }

  /**
   * Getter beautyRenderDelay
   * @return {number}
   */
  public get beautyRenderDelay(): number {
    return this.#renderingEngine.beautyRenderDelay;
  }

  /**
   * Setter beautyRenderDelay
   * @param {number} value
   */
  public set beautyRenderDelay(value: number) {
    this.#renderingEngine.beautyRenderDelay = value;
  }

  /**
   * Getter blurSceneWhenBusy
   * @return {boolean}
   */
  public get blurSceneWhenBusy(): boolean {
    return this.#renderingEngine.blurSceneWhenBusy;
  }

  /**
   * Setter blurSceneWhenBusy
   * @param {boolean} value
   */
  public set blurSceneWhenBusy(value: boolean) {
    this.#renderingEngine.blurSceneWhenBusy = value;
  }

  /**
   * Getter clearAlpha
   * @return {number}
   */
  public get clearAlpha(): number {
    return this.#renderingEngine.clearAlpha;
  }

  /**
   * Setter clearAlpha
   * @param {number} value
   */
  public set clearAlpha(value: number) {
    this.#renderingEngine.clearAlpha = value;
  }

  /**
   * Getter clearColor
   * @return {vec3}
   */
  public get clearColor(): vec3 {
    return this.#renderingEngine.clearColor;
  }

  /**
   * Setter clearColor
   * @param {vec3} value
   */
  public set clearColor(value: vec3) {
    this.#renderingEngine.clearColor = value;
  }

  /**
   * Getter duration
   * @return {number}
   */
  public get duration(): number {
    return this.#renderingEngine.duration;
  }

  /**
   * Setter duration
   * @param {number} value
   */
  public set duration(value: number) {
    this.#renderingEngine.duration = value;
  }

  /**
   * Getter environmentMap
   * @return {string}
   */
  public get environmentMap(): string {
    return this.#renderingEngine.environmentMap;
  }

  /**
   * Setter environmentMap
   * @param {string} value
   */
  public set environmentMap(value: string) {
    this.#renderingEngine.environmentMap = value;
  }

  /**
   * Getter environmentMapAsBackground
   * @return {boolean}
   */
  public get environmentMapAsBackground(): boolean {
    return this.#renderingEngine.environmentMapAsBackground;
  }

  /**
   * Setter environmentMapAsBackground
   * @param {boolean} value
   */
  public set environmentMapAsBackground(value: boolean) {
    this.#renderingEngine.environmentMapAsBackground = value;
  }

  /**
   * Getter environmentMapResolution
   * @return {string}
   */
  public get environmentMapResolution(): string {
    return this.#renderingEngine.environmentMapResolution;
  }

  /**
   * Setter environmentMapResolution
   * @param {string} value
   */
  public set environmentMapResolution(value: string) {
    this.#renderingEngine.environmentMapResolution = value;
  }

  /**
   * Getter fullscreen
   * @return {boolean}
   */
  public get fullscreen(): boolean {
    return this.#renderingEngine.fullscreen;
  }

  /**
   * Setter fullscreen
   * @param {boolean} value
   */
  public set fullscreen(value: boolean) {
    this.#renderingEngine.fullscreen = value;
  }

  /**
   * Getter gridVisibility
   * @return {boolean}
   */
  public get gridVisibility(): boolean {
    return this.#renderingEngine.gridVisibility;
  }

  /**
   * Setter gridVisibility
   * @param {boolean} value
   */
  public set gridVisibility(value: boolean) {
    this.#renderingEngine.gridVisibility = value;
  }

  /**
   * Getter groundPlaneReflectionThreshold
   * @return {number}
   */
  public get groundPlaneReflectionThreshold(): number {
    return this.#renderingEngine.groundPlaneReflectionThreshold;
  }

  /**
   * Setter groundPlaneReflectionThreshold
   * @param {number} value
   */
  public set groundPlaneReflectionThreshold(value: number) {
    this.#renderingEngine.groundPlaneReflectionThreshold = value;
  }

  /**
   * Getter groundPlaneReflectionVisibility
   * @return {boolean}
   */
  public get groundPlaneReflectionVisibility(): boolean {
    return this.#renderingEngine.groundPlaneReflectionVisibility;
  }

  /**
   * Setter groundPlaneReflectionVisibility
   * @param {boolean} value
   */
  public set groundPlaneReflectionVisibility(value: boolean) {
    this.#renderingEngine.groundPlaneReflectionVisibility = value;
  }

  /**
   * Getter groundPlaneVisibility
   * @return {boolean}
   */
  public get groundPlaneVisibility(): boolean {
    return this.#renderingEngine.groundPlaneVisibility;
  }

  /**
   * Setter groundPlaneVisibility
   * @param {boolean} value
   */
  public set groundPlaneVisibility(value: boolean) {
    this.#renderingEngine.groundPlaneVisibility = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this.#renderingEngine.id;
  }

  /**
   * Getter lightHelper
   * @return {boolean}
   */
  public get lightHelper(): boolean {
    return this.#renderingEngine.lightHelper;
  }

  /**
   * Setter lightHelper
   * @param {boolean} value
   */
  public set lightHelper(value: boolean) {
    this.#renderingEngine.lightHelper = value;
  }

  /**
   * Getter lightScene
   * @return {string}
   */
  public get lightScene(): string {
    return this.#renderingEngine.lightScene;
  }

  /**
   * Setter lightScene
   * @param {string} value
   */
  public set lightScene(value: string) {
    this.#renderingEngine.lightScene = value;
  }

  /**
   * Getter pointSize
   * @return {number}
   */
  public get pointSize(): number {
    return this.#renderingEngine.pointSize;
  }

  /**
   * Setter pointSize
   * @param {number} value
   */
  public set pointSize(value: number) {
    this.#renderingEngine.pointSize = value;
  }

  /**
   * Getter shadows
   * @return {boolean}
   */
  public get shadows(): boolean {
    return this.#renderingEngine.shadows;
  }

  /**
   * Setter shadows
   * @param {boolean} value
   */
  public set shadows(value: boolean) {
    this.#renderingEngine.shadows = value;
  }

  /**
   * Getter show
   * @return {boolean}
   */
  public get show(): boolean {
    return this.#renderingEngine.show;
  }

  /**
   * Setter show
   * @param {boolean} value
   */
  public set show(value: boolean) {
    this.#renderingEngine.show = value;
  }

  // #endregion Public Accessors (42)

  // #region Public Methods (11)


  public update(): void {
    this.#renderingEngine.update();
  }

  public assignCamera(id: string): void {
    this.#renderingEngine.cameraEngine.assignCamera(id);
  }

  public createCamera(type: CAMERATYPE, id?: string): Camera {
    const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
    this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    return this.#cameras[cameraLogic.id];
  }

  public getCamera(id: string): Camera {
    const cameraLogic = this.#renderingEngine.cameraEngine.getCamera(id);
    if (!this.#cameras[cameraLogic.id]) this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    return this.#cameras[cameraLogic.id];
  }

  public getCameras(): { [key: string]: Camera } {
    const cameraLogic = this.#renderingEngine.cameraEngine.getCameras();
    const cameras: { [key: string]: Camera; } = {};
    for (let e in cameraLogic) {
      if (!this.#cameras[cameraLogic[e].id]) this.#cameras[cameraLogic[e].id] = cameraLogic[e].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic[e]) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic[e]);
      cameras[e] = this.#cameras[cameraLogic[e].id];
    }
    return cameras;
  }

  public hasCamera(): boolean {
    return this.#renderingEngine.cameraEngine.hasCamera();
  }






  public addAmbientLight(color: vec3, intensity: number, id?: string): AmbientLight {
    const lightLogic = this.#renderingEngine.lightEngine.addAmbientLight(color, intensity, id)
    this.#lights[(<AbstractLight>lightLogic).id] = new AmbientLight(<AmbientLightLogic>lightLogic);
    this.update();
    return <AmbientLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  public addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, shadowMapResolution: number, shadowMapRadius: number, shadowMapBias: number, id?: string): DirectionalLight {
    const lightLogic = this.#renderingEngine.lightEngine.addDirectionalLight(color, intensity, direction, castShadow, shadowMapResolution, shadowMapRadius, shadowMapBias, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new DirectionalLight(<DirectionalLightLogic>lightLogic);
    this.update();
    return <DirectionalLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  public addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, id?: string): HemisphereLight {
    const lightLogic = this.#renderingEngine.lightEngine.addHemisphereLight(color, intensity, groundColor, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new HemisphereLight(<HemisphereLightLogic>lightLogic);
    this.update();
    return <HemisphereLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  public addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, id?: string): PointLight {
    const lightLogic = this.#renderingEngine.lightEngine.addPointLight(color, intensity, position, distance, decay, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new PointLight(<PointLightLogic>lightLogic);
    this.update();
    return <PointLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  public addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, id?: string): SpotLight {
    const lightLogic = this.#renderingEngine.lightEngine.addSpotLight(color, intensity, position, target, distance, decay, angle, penumbra, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new SpotLight(<SpotLightLogic>lightLogic);
    this.update();
    return <SpotLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  public createLightScene(id?: string, standard?: boolean): string {
    const r = this.#renderingEngine.lightEngine.createLightScene(id, standard);
    this.update();
    return r;
  }

  public removeLightScene(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.removeLightScene(id);
    this.update();
    return r;
  }

  public getLightScene(): string {
    return this.#renderingEngine.lightEngine.getLightScene();
  }

  public getLightScenes(): string[] {
    return this.#renderingEngine.lightEngine.getLightScenes();
  }

  public removeLight(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.removeLight(id);
    this.update();
    return r;
  }

  public assignLightScene(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.assignLightScene(id);
    this.update();
    return r;
  }

  public getLight(id: string): Light {
    if (!this.#lights[id]) {
      const lightLogic = this.#renderingEngine.lightEngine.getLight(id);
      switch (lightLogic.type) {
        case LIGHTTYPE.DIRECTIONAL:
          this.#lights[id] = new DirectionalLight(<DirectionalLightLogic>lightLogic);
          break;
        case LIGHTTYPE.HEMISPHERE:
          this.#lights[id] = new HemisphereLight(<HemisphereLightLogic>lightLogic);
          break;
        case LIGHTTYPE.POINT:
          this.#lights[id] = new PointLight(<PointLightLogic>lightLogic);
          break;
        case LIGHTTYPE.SPOT:
          this.#lights[id] = new SpotLight(<SpotLightLogic>lightLogic);
          break;
        case LIGHTTYPE.AMBIENT:
        default:
          this.#lights[id] = new AmbientLight(<AmbientLightLogic>lightLogic);
      }
    }
    return this.#lights[id];
  }

  public getLights(): { [key: string]: Light } {
    const lightLogic = this.#renderingEngine.lightEngine.getLights();
    const lights: { [key: string]: Light } = {};
    for (let l in lightLogic)
      lights[l] = this.getLight(l);
    return lights;
  }

  // #endregion Public Methods (11)
}