import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CAMERATYPE, ICameraEngine, PerspectiveCamera as PerspectiveCameraLogic, OrthographicCamera as OrthographicCameraLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractLight, ILightEngine, AmbientLight as AmbientLightLogic, DirectionalLight as DirectionalLightLogic, HemisphereLight as HemisphereLightLogic, PointLight as PointLightLogic, SpotLight as SpotLightLogic, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { IRenderingEngine, RENDERERTYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";
import { container, injectable } from "tsyringe";
import { Camera } from "./camera/Camera";
import { OrthographicCamera } from "./camera/OrthographicCamera";
import { PerspectiveCamera } from "./camera/PerspectiveCamera";
import { AmbientLight } from "./lights/AmbientLight";
import { DirectionalLight } from "./lights/DirectionalLight";
import { HemisphereLight } from "./lights/HemisphereLight";
import { Light } from "./lights/Light";
import { PointLight } from "./lights/PointLight";
import { SpotLight } from "./lights/SpotLight";
@injectable()
export class Viewer implements ILightEngine, ICameraEngine, IRenderingEngine {
  // #region Properties (25)
  readonly #renderingEngine: RenderingEngineThreejs;
  readonly #performanceEvaluator: PerformanceEvaluator;
  readonly #logger: Logger;
  readonly #eventEngine: EventEngine;
  
  readonly #cameras: {
    [key: string]: Camera
  } = {};
  readonly #lights: {
    [key: string]: Light
  } = {};
  // #endregion Properties (25)

  // #region Constructors (1)

  /**
   * @ignore
   * @param id 
   * @param type 
   * @param canvas 
   */
  constructor(id: string, type: RENDERERTYPE, canvas: HTMLCanvasElement) {
    this.#performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    this.#logger = <Logger>container.resolve(Logger);
    this.#eventEngine = <EventEngine>container.resolve(EventEngine);
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
   * Enable / Disable the ambient occlusion
   * @return {boolean}
   */
  public get ambientOcclusion(): boolean {
    return this.#renderingEngine.ambientOcclusion;
  }

  /**
   * Enable / Disable the ambient occlusion
   * @param {boolean} value
   */
  public set ambientOcclusion(value: boolean) {
    this.#renderingEngine.ambientOcclusion = value;
    this.#logger.info(`Viewer (${this.id}): ambientOcclusion was set to: ${value}`);
  }

  /**
   * Time to blend the beauty rendering
   * @return {number}
   */
  public get beautyRenderBlendingDuration(): number {
    return this.#renderingEngine.beautyRenderBlendingDuration;
  }

  /**
   * Time to blend the beauty rendering
   * @param {number} value
   */
  public set beautyRenderBlendingDuration(value: number) {
    this.#renderingEngine.beautyRenderBlendingDuration = value;
    this.#logger.info(`Viewer (${this.id}): beautyRenderBlendingDuration was set to: ${value}`);
  }

  /**
   * Time to delay the beauty rendering
   * @return {number}
   */
  public get beautyRenderDelay(): number {
    return this.#renderingEngine.beautyRenderDelay;
  }

  /**
   * Time to delay the beauty rendering
   * @param {number} value
   */
  public set beautyRenderDelay(value: number) {
    this.#renderingEngine.beautyRenderDelay = value;
    this.#logger.info(`Viewer (${this.id}): beautyRenderDelay was set to: ${value}`);
  }

  /**
   * Blur or don't blur the scene while a session is busy
   * @return {boolean}
   */
  public get blurSceneWhenBusy(): boolean {
    return this.#renderingEngine.blurSceneWhenBusy;
  }

  /**
   * Blur or don't blur the scene while a session is busy
   * @param {boolean} value
   */
  public set blurSceneWhenBusy(value: boolean) {
    this.#renderingEngine.blurSceneWhenBusy = value;
    this.#logger.info(`Viewer (${this.id}): blurSceneWhenBusy was set to: ${value}`);
  }

  /**
   * Background alpha value
   * @return {number}
   */
  public get clearAlpha(): number {
    return this.#renderingEngine.clearAlpha;
  }

  /**
   * Background alpha value
   * @param {number} value
   */
  public set clearAlpha(value: number) {
    this.#renderingEngine.clearAlpha = value;
    this.#logger.info(`Viewer (${this.id}): clearAlpha was set to: ${value}`);
  }

  /**
   * Background color value
   * @return {vec3}
   */
  public get clearColor(): vec3 {
    return this.#renderingEngine.clearColor;
  }

  /**
   * Background color value
   * @param {vec3} value
   */
  public set clearColor(value: vec3) {
    this.#renderingEngine.clearColor = value;
    this.#logger.info(`Viewer (${this.id}): clearColor was set to: ${value}`);
  }

  /**
   * Fade in / out duration
   * @return {number}
   */
  public get duration(): number {
    return this.#renderingEngine.duration;
  }

  /**
   * Fade in / out duration
   * @param {number} value
   */
  public set duration(value: number) {
    this.#renderingEngine.duration = value;
    this.#logger.info(`Viewer (${this.id}): duration was set to: ${value}`);
  }

  /**
   * Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)
   * @return {string | string[]}
   */
  public get environmentMap(): string | string[] {
    return this.#renderingEngine.environmentMap;
  }

  /**
   * Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)
   * @param {string | string[]} value
   */
  public set environmentMap(value: string | string[]) {
    this.#renderingEngine.environmentMap = value;
    this.#logger.info(`Viewer (${this.id}): environmentMap was set to: ${value}`);
  }

  /**
   * Show / Hide the environment map in the background
   * @return {boolean}
   */
  public get environmentMapAsBackground(): boolean {
    return this.#renderingEngine.environmentMapAsBackground;
  }

  /**
   * Show / Hide the environment map in the background
   * @param {boolean} value
   */
  public set environmentMapAsBackground(value: boolean) {
    this.#renderingEngine.environmentMapAsBackground = value;
    this.#logger.info(`Viewer (${this.id}): environmentMapAsBackground was set to: ${value}`);
  }

  /**
   * Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)
   * @return {string}
   */
  public get environmentMapResolution(): string {
    return this.#renderingEngine.environmentMapResolution;
  }

  /**
   * Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)
   * @param {string} value
   */
  public set environmentMapResolution(value: string) {
    this.#renderingEngine.environmentMapResolution = value;
    this.#logger.info(`Viewer (${this.id}): environmentMapResolution was set to: ${value}`);
  }

  /**
   * Enable / Disable fullscreen mode
   * @return {boolean}
   */
  public get fullscreen(): boolean {
    return this.#renderingEngine.fullscreen;
  }

  /**
   * Enable / Disable fullscreen mode
   * @param {boolean} value
   */
  public set fullscreen(value: boolean) {
    this.#renderingEngine.fullscreen = value;
    this.#logger.info(`Viewer (${this.id}): fullscreen was set to: ${value}`);
  }

  /**
   * Show / Hide the grid
   * @return {boolean}
   */
  public get gridVisibility(): boolean {
    return this.#renderingEngine.gridVisibility;
  }

  /**
   * Show / Hide the grid
   * @param {boolean} value
   */
  public set gridVisibility(value: boolean) {
    this.#renderingEngine.gridVisibility = value;
    this.#logger.info(`Viewer (${this.id}): gridVisibility was set to: ${value}`);
  }

  // /**
  //  * Allows to control the distance to objects that are still reflected by the groundplane
  //  * @return {number}
  //  */
  // public get groundPlaneReflectionThreshold(): number {
  //   return this.#renderingEngine.groundPlaneReflectionThreshold;
  // }

  // /**
  //  * Allows to control the distance to objects that are still reflected by the groundplane
  //  * @param {number} value
  //  */
  // public set groundPlaneReflectionThreshold(value: number) {
  //   this.#renderingEngine.groundPlaneReflectionThreshold = value;
  // }

  // /**
  //  * Enable / Disable the reflectivity of the groundplane
  //  * @return {boolean}
  //  */
  // public get groundPlaneReflectionVisibility(): boolean {
  //   return this.#renderingEngine.groundPlaneReflectionVisibility;
  // }

  // /**
  //  * Enable / Disable the reflectivity of the groundplane
  //  * @param {boolean} value
  //  */
  // public set groundPlaneReflectionVisibility(value: boolean) {
  //   this.#renderingEngine.groundPlaneReflectionVisibility = value;
  // }

  /**
   * Show / Hide the ground plane
   * @return {boolean}
   */
  public get groundPlaneVisibility(): boolean {
    return this.#renderingEngine.groundPlaneVisibility;
  }

  /**
   * Show / Hide the ground plane
   * @param {boolean} value
   */
  public set groundPlaneVisibility(value: boolean) {
    this.#renderingEngine.groundPlaneVisibility = value;
    this.#logger.info(`Viewer (${this.id}): groundPlaneVisibility was set to: ${value}`);
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this.#renderingEngine.id;
  }

  /**
   * Show / Hide the light helpers
   * @return {boolean}
   */
  public get lightHelper(): boolean {
    return this.#renderingEngine.lightHelper;
  }

  /**
   * Show / Hide the light helpers
   * @param {boolean} value
   */
  public set lightHelper(value: boolean) {
    this.#renderingEngine.lightHelper = value;
    this.#logger.info(`Viewer (${this.id}): lightHelper was set to: ${value}`);
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
    this.#logger.info(`Viewer (${this.id}): lightScene was set to: ${value}`);
  }

  /**
   * Size of points
   * @return {number}
   */
  public get pointSize(): number {
    return this.#renderingEngine.pointSize;
  }

  /**
   * Size of points
   * @param {number} value
   */
  public set pointSize(value: number) {
    this.#renderingEngine.pointSize = value;
    this.#logger.info(`Viewer (${this.id}): pointSize was set to: ${value}`);
  }

  /**
   * Enable / Disable shadows
   * @return {boolean}
   */
  public get shadows(): boolean {
    return this.#renderingEngine.shadows;
  }

  /**
   * Enable / Disable shadows
   * @param {boolean} value
   */
  public set shadows(value: boolean) {
    this.#renderingEngine.shadows = value;
    this.#logger.info(`Viewer (${this.id}): shadows was set to: ${value}`);
  }

  /**
   * Show / Hide the scene
   * @return {boolean}
   */
  public get show(): boolean {
    return this.#renderingEngine.show;
  }

  /**
   * Show / Hide the scene
   * @param {boolean} value
   */
  public set show(value: boolean) {
    this.#renderingEngine.show = value;
    this.#logger.info(`Viewer (${this.id}): show was set to: ${value}`);
  }

  // #endregion Public Accessors (42)

  // #region Public Methods (11)


  /**
   * Update the viewer with the current changes of the scene tree.
   */
  public update(): void {
    this.#renderingEngine.update();
    this.#logger.info(`Viewer (${this.id}) was updated.`);
    this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_UPDATED, { viewer: this });
  }

  /**
   * Assign the camera with the specified id to the viewer.
   * 
   * @param id the id of the camera
   */
  public assignCamera(id: string): void {
    // MICHI START HERE
    this.#renderingEngine.cameraEngine.assignCamera(id);
  }

  /**
   * Create a perspective camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createPerspectiveCamera(id?: string): Camera {
    return this.createCamera(CAMERATYPE.PERSPECTIVE, id);
  }

  /**
   * Create an orthographic camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createOrthographicCamera(id?: string): Camera {
    return this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
  }

  /**
   * Create a camera with the specified type.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param type the type of the camera
   * @param id the id of the camera
   * @returns 
   */
  public createCamera(type: CAMERATYPE, id?: string): Camera {
    const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
    this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    return this.#cameras[cameraLogic.id];
  }

  /**
   * Return the camera with the specified id.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public getCamera(id: string): Camera | null {
    const cameraLogic = this.#renderingEngine.cameraEngine.getCamera(id);
    if(!cameraLogic) return null;
    if (!this.#cameras[cameraLogic.id]) this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    return this.#cameras[cameraLogic.id];
  }

  /**
   * Return all camera as key-value pairs with the id of the camera being the key.
   * 
   * @returns 
   */
  public getCameras(): { [key: string]: Camera } {
    const cameraLogic = this.#renderingEngine.cameraEngine.getCameras();
    const cameras: { [key: string]: Camera; } = {};
    for (let e in cameraLogic) {
      if (!this.#cameras[cameraLogic[e].id]) this.#cameras[cameraLogic[e].id] = cameraLogic[e].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic[e]) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic[e]);
      cameras[e] = this.#cameras[cameraLogic[e].id];
    }
    return cameras;
  }

  /**
   * Return if the viewer has currently a camera assigned.
   * 
   * @returns 
   */
  public hasCamera(): boolean {
    return this.#renderingEngine.cameraEngine.hasCamera();
  }





  /**
   * Add an ambient light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param color the color of the light
   * @param intensity the intensity of the light
   * @param id the id of the light
   * @returns 
   */
  public addAmbientLight(color: vec3, intensity: number, id?: string): AmbientLight {
    const lightLogic = this.#renderingEngine.lightEngine.addAmbientLight(color, intensity, id)
    this.#lights[(<AbstractLight>lightLogic).id] = new AmbientLight(<AmbientLightLogic>lightLogic);
    this.update();
    return <AmbientLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a directional light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param color the color of the light
   * @param intensity the intensity of the light
   * @param direction the directional of the light
   * @param castShadow the option to cast shadow
   * @param shadowMapResolution the resolution of the shadow map
   * @param shadowMapBias the bias of the shadow map
   * @param id the id of the light
   * @returns 
   */
  public addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, shadowMapResolution: number, shadowMapBias: number, id?: string): DirectionalLight {
    const lightLogic = this.#renderingEngine.lightEngine.addDirectionalLight(color, intensity, direction, castShadow, shadowMapResolution, shadowMapBias, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new DirectionalLight(<DirectionalLightLogic>lightLogic);
    this.update();
    return <DirectionalLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a hemisphere light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param color the color of the light
   * @param intensity the intensity of the light
   * @param groundColor the ground color of the light
   * @param id the id of the light
   * @returns 
   */
  public addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, id?: string): HemisphereLight {
    const lightLogic = this.#renderingEngine.lightEngine.addHemisphereLight(color, intensity, groundColor, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new HemisphereLight(<HemisphereLightLogic>lightLogic);
    this.update();
    return <HemisphereLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a point light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param color the color of the light
   * @param intensity the intensity of the light
   * @param position the position of the light
   * @param distance the distance of the light radiance
   * @param decay the decay of the light radiance
   * @param id the id of the light
   * @returns 
   */
  public addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, id?: string): PointLight {
    const lightLogic = this.#renderingEngine.lightEngine.addPointLight(color, intensity, position, distance, decay, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new PointLight(<PointLightLogic>lightLogic);
    this.update();
    return <PointLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a spot light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param color the color of the light
   * @param intensity the intensity of the light
   * @param position the position of the light
   * @param target the target of the light
   * @param distance the distance of the light radiance
   * @param decay the decay of the light radiance
   * @param angle the angle of the light cone
   * @param penumbra the percentage of the cone that is part of the penmubra
   * @param id the id of the light
   * @returns 
   */
  public addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, id?: string): SpotLight {
    const lightLogic = this.#renderingEngine.lightEngine.addSpotLight(color, intensity, position, target, distance, decay, angle, penumbra, id);
    this.#lights[(<AbstractLight>lightLogic).id] = new SpotLight(<SpotLightLogic>lightLogic);
    this.update();
    return <SpotLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Create a new light scene.
   * An id can be provided. If not, a unique id will be created.
   * If the standard option is chosen, the default lights will be added from the start.
   * 
   * @param id the id of the light scene
   * @param standard the option to add the standard lights
   * @returns 
   */
  public createLightScene(id?: string, standard?: boolean): string {
    const r = this.#renderingEngine.lightEngine.createLightScene(id, standard);
    this.update();
    return r;
  }

  /**
   * Remove the light scene with the specified id.
   * 
   * @param id the id of the light scene
   * @returns 
   */
  public removeLightScene(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.removeLightScene(id);
    this.update();
    return r;
  }

  /**
   * Return the id of the current light scene.
   * 
   * @returns 
   */
  public getLightScene(): string {
    return this.#renderingEngine.lightEngine.getLightScene();
  }

  /**
   * Return the ids of all light scene in an array.
   * 
   * @returns 
   */
  public getLightScenes(): string[] {
    return this.#renderingEngine.lightEngine.getLightScenes();
  }

  /**
   * Remove the light with the specified id from the current light scene.
   * 
   * @param id the id of the light
   * @returns 
   */
  public removeLight(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.removeLight(id);
    this.update();
    return r;
  }

  /**
   * Assign the light scene with the current id to the viewer.
   * 
   * @param id the id of the light scene 
   * @returns 
   */
  public assignLightScene(id: string): boolean {
    const r = this.#renderingEngine.lightEngine.assignLightScene(id);
    this.update();
    return r;
  }

  /**
   * Return the light with the specified id.
   * 
   * @param id the id of the light
   * @returns 
   */
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

  
  /**
   * Return all lights as key-value pairs with the id of the light being the key.
   * 
   * @returns 
   */
  public getLights(): { [key: string]: Light } {
    const lightLogic = this.#renderingEngine.lightEngine.getLights();
    const lights: { [key: string]: Light } = {};
    for (let l in lightLogic)
      lights[l] = this.getLight(l);
    return lights;
  }

  // #endregion Public Methods (11)
}