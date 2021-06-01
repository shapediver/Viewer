import { RenderingEngine as RenderingEngineThreejs } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CAMERATYPE, ICameraEngine, PerspectiveCamera as PerspectiveCameraLogic, OrthographicCamera as OrthographicCameraLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractLight, ILightEngine, AmbientLight as AmbientLightLogic, DirectionalLight as DirectionalLightLogic, HemisphereLight as HemisphereLightLogic, PointLight as PointLightLogic, SpotLight as SpotLightLogic, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { IRenderingEngine, RENDERERTYPE, VISIBILITYMODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter, InputValidator, UuidGenerator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container, injectable } from "tsyringe";
import { Camera } from "./camera/Camera";
import { OrthographicCamera } from "./camera/OrthographicCamera";
import { PerspectiveCamera } from "./camera/PerspectiveCamera";
import { AmbientLight } from "./lights/AmbientLight";
import { DirectionalLight } from "./lights/DirectionalLight";
import { HemisphereLight } from "./lights/HemisphereLight";
import { Light } from "./lights/Light";
import { LightScene } from "./lights/LightScene";
import { PointLight } from "./lights/PointLight";
import { SpotLight } from "./lights/SpotLight";
@injectable()
export class Viewer implements ILightEngine, ICameraEngine, IRenderingEngine {
  // #region Properties (10)

  readonly #cameras: {
    [key: string]: Camera
  } = {};
  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #lightScenes: {
    [key: string]: LightScene
  } = {};
  readonly #lights: {
    [key: string]: Light
  } = {};
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

  #properties: { id: string, canvas?: HTMLCanvasElement, type: RENDERERTYPE, visibility: VISIBILITYMODE };
  #renderingEngine!: RenderingEngineThreejs;
  #initialized = false;

  // #endregion Properties (10)

  // #region Constructors (1)

  /**
   * @ignore
   * @param id 
   * @param type 
   * @param canvas 
   */
  constructor(properties: { id: string, canvas?: HTMLCanvasElement, type: RENDERERTYPE, visibility: VISIBILITYMODE }, callbacks: any) {
    this.#properties = properties;
    callbacks.close = async (): Promise<boolean> => {
      const closeResult = await this.#renderingEngine.close();
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CLOSED, {});

      if (!closeResult) this.#logger.warn(`Viewer (${this.id}): Was not able to close viewer completely, please disregard this viewer.`);
      return closeResult;
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (33)

  /**
   * Enable / Disable the ambient occlusion
   * @return {boolean}
   */
  public get ambientOcclusion(): boolean {
    this.isInitialized();
    return this.#renderingEngine.ambientOcclusion;
  }

  /**
   * Enable / Disable the ambient occlusion
   * @param {boolean} value
   */
  public set ambientOcclusion(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.ambientOcclusion = value;
    this.#logger.info(`Viewer (${this.id}): ambientOcclusion was set to: ${value}`);
  }

  /**
   * If the canvas should be automatically resized
   * @return {boolean}
   */
  public get automaticResizing(): boolean {
    this.isInitialized();
    return this.#renderingEngine.automaticResizing;
  }

  /**
   * If the canvas should be automatically resized
   * @param {boolean} value
   */
  public set automaticResizing(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.automaticResizing = value;
    this.#logger.info(`Viewer (${this.id}): automaticResizing was set to: ${value}`);
  }

  /**
   * Time to blend the beauty rendering
   * @return {number}
   */
  public get beautyRenderBlendingDuration(): number {
    this.isInitialized();
    return this.#renderingEngine.beautyRenderBlendingDuration;
  }

  /**
   * Time to blend the beauty rendering
   * @param {number} value
   */
  public set beautyRenderBlendingDuration(value: number) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'positive');
    this.#renderingEngine.beautyRenderBlendingDuration = value;
    this.#logger.info(`Viewer (${this.id}): beautyRenderBlendingDuration was set to: ${value}`);
  }

  /**
   * Time to delay the beauty rendering
   * @return {number}
   */
  public get beautyRenderDelay(): number {
    this.isInitialized();
    return this.#renderingEngine.beautyRenderDelay;
  }

  /**
   * Time to delay the beauty rendering
   * @param {number} value
   */
  public set beautyRenderDelay(value: number) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'positive');
    this.#renderingEngine.beautyRenderDelay = value;
    this.#logger.info(`Viewer (${this.id}): beautyRenderDelay was set to: ${value}`);
  }

  /**
   * Blur or don't blur the scene while a session is busy
   * @return {boolean}
   */
  public get blurSceneWhenBusy(): boolean {
    this.isInitialized();
    return this.#renderingEngine.blurSceneWhenBusy;
  }

  /**
   * Blur or don't blur the scene while a session is busy
   * @param {boolean} value
   */
  public set blurSceneWhenBusy(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.blurSceneWhenBusy = value;
    this.#logger.info(`Viewer (${this.id}): blurSceneWhenBusy was set to: ${value}`);
  }

  /**
   * Background alpha value
   * @return {number}
   */
  public get clearAlpha(): number {
    this.isInitialized();
    return this.#renderingEngine.clearAlpha;
  }

  /**
   * Background alpha value
   * @param {number} value
   */
  public set clearAlpha(value: number) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'factor');
    this.#renderingEngine.clearAlpha = value;
    this.#logger.info(`Viewer (${this.id}): clearAlpha was set to: ${value}`);
  }

  /**
   * Background color value
   * @return {string | number | vec3}
   */
  public get clearColor(): string | number | vec3 {
    this.isInitialized();
    return this.#renderingEngine.clearColor;
  }

  /**
   * Background color value
   * @param {string | number | vec3} value
   */
  public set clearColor(value: string | number | vec3) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'color');
    this.#renderingEngine.clearColor = this.#converter.toColor(value);
    this.#logger.info(`Viewer (${this.id}): clearColor was set to: ${value}`);
  }

  /**
   * Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)
   * @return {string | string[]}
   */
  public get environmentMap(): string | string[] {
    this.isInitialized();
    return this.#renderingEngine.environmentMap;
  }

  /**
   * Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)
   * @param {string | string[]} value
   */
  public set environmentMap(value: string | string[]) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'cubeMap');
    this.#renderingEngine.environmentMap = value;
    this.#logger.info(`Viewer (${this.id}): environmentMap was set to: ${value}`);
  }

  /**
   * Show / Hide the environment map in the background
   * @return {boolean}
   */
  public get environmentMapAsBackground(): boolean {
    this.isInitialized();
    return this.#renderingEngine.environmentMapAsBackground;
  }

  /**
   * Show / Hide the environment map in the background
   * @param {boolean} value
   */
  public set environmentMapAsBackground(value: boolean) {
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.environmentMapAsBackground = value;
    this.#logger.info(`Viewer (${this.id}): environmentMapAsBackground was set to: ${value}`);
  }

  /**
   * Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)
   * @return {string}
   */
  public get environmentMapResolution(): string {
    this.isInitialized();
    return this.#renderingEngine.environmentMapResolution;
  }

  /**
   * Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)
   * @param {string} value
   */
  public set environmentMapResolution(value: string) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'string');
    this.#renderingEngine.environmentMapResolution = value;
    this.#logger.info(`Viewer (${this.id}): environmentMapResolution was set to: ${value}`);
  }

  /**
   * Show / Hide the grid
   * @return {boolean}
   */
  public get gridVisibility(): boolean {
    this.isInitialized();
    return this.#renderingEngine.gridVisibility;
  }

  /**
   * Show / Hide the grid
   * @param {boolean} value
   */
  public set gridVisibility(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.gridVisibility = value;
    this.#logger.info(`Viewer (${this.id}): gridVisibility was set to: ${value}`);
  }

  /**
   * Show / Hide the ground plane
   * @return {boolean}
   */
  public get groundPlaneVisibility(): boolean {
    this.isInitialized();
    return this.#renderingEngine.groundPlaneVisibility;
  }

  /**
   * Show / Hide the ground plane
   * @param {boolean} value
   */
  public set groundPlaneVisibility(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.groundPlaneVisibility = value;
    this.#logger.info(`Viewer (${this.id}): groundPlaneVisibility was set to: ${value}`);
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    this.isInitialized();
    return this.#renderingEngine.id;
  }

  /**
   * If the viewer was already initialized.
   * @return {boolean}
   */
  public get initialized(): boolean {
    return this.#initialized;
  }

  /**
   * Getter lightScene
   * @return {string}
   */
  public get lightScene(): string {
    this.isInitialized();
    return this.#renderingEngine.lightScene;
  }

  /**
   * Setter lightScene
   * @param {string} value
   */
  public set lightScene(value: string) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'string');
    if (this.assignLightScene(value)) {
      this.#renderingEngine.lightScene = value;
      this.#logger.info(`Viewer (${this.id}): lightScene was set to: ${value}`);
    }
  }

  /**
   * Size of points
   * @return {number}
   */
  public get pointSize(): number {
    this.isInitialized();
    return this.#renderingEngine.pointSize;
  }

  /**
   * Size of points
   * @param {number} value
   */
  public set pointSize(value: number) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'positive');
    this.#renderingEngine.pointSize = value;
    this.#logger.info(`Viewer (${this.id}): pointSize was set to: ${value}`);
  }

  /**
   * Enable / Disable shadows
   * @return {boolean}
   */
  public get shadows(): boolean {
    this.isInitialized();
    return this.#renderingEngine.shadows;
  }

  /**
   * Enable / Disable shadows
   * @param {boolean} value
   */
  public set shadows(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.shadows = value;
    this.#logger.info(`Viewer (${this.id}): shadows was set to: ${value}`);
  }

  /**
   * Show / Hide the scene
   * @return {boolean}
   */
  public get show(): boolean {
    this.isInitialized();
    return this.#renderingEngine.show;
  }

  /**
   * Show / Hide the scene
   * @param {boolean} value
   */
  public set show(value: boolean) {
    this.isInitialized();
    this.#inputValidator.validate(value, 'boolean');
    this.#renderingEngine.show = value;
    this.#logger.info(`Viewer (${this.id}): show was set to: ${value}`);
  }

  // #endregion Public Accessors (33)

  // #region Public Methods (25)

  /**
   * Add an ambient light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.id the id of the light
   * @returns 
   */
  public addAmbientLight(properties: { color?: string | number | vec3, intensity?: number, id?: string, name?: string }): AmbientLight {
    this.isInitialized();
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.color, 'color', false);
    this.#inputValidator.validate(props.intensity, 'positive', false);
    this.#inputValidator.validate(props.id, 'string', false);
    this.#inputValidator.validate(props.name, 'string', false);
    if(props.color !== undefined) props.color = this.#converter.toColor(props.color);
    const lightLogic = this.#renderingEngine.lightEngine.addAmbientLight(props)
    this.#lights[(<AbstractLight>lightLogic).id] = new AmbientLight(<AmbientLightLogic>lightLogic);
    this.#logger.info(`Viewer (${this.id}): Ambient light with id ${(<AbstractLight>lightLogic).id} created.`);
    this.update();
    return <AmbientLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a directional light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.direction the directional of the light
   * @param properties.castShadow the option to cast shadow
   * @param properties.shadowMapResolution the resolution of the shadow map
   * @param properties.shadowMapBias the bias of the shadow map
   * @param properties.id the id of the light
   * @returns 
   */
  public addDirectionalLight(properties: { color?: string | number | vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, id?: string, name?: string }): DirectionalLight {
    this.isInitialized();
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.color, 'color', false);
    this.#inputValidator.validate(props.intensity, 'positive', false);
    this.#inputValidator.validate(props.id, 'string', false);
    this.#inputValidator.validate(properties.direction, 'vec3', false);
    this.#inputValidator.validate(properties.castShadow, 'boolean', false);
    this.#inputValidator.validate(properties.shadowMapResolution, 'positive', false);
    this.#inputValidator.validate(properties.shadowMapBias, 'number', false);
    this.#inputValidator.validate(props.name, 'string', false);
    if(props.color !== undefined) props.color = this.#converter.toColor(props.color);
    const lightLogic = this.#renderingEngine.lightEngine.addDirectionalLight(props);
    this.#lights[(<AbstractLight>lightLogic).id] = new DirectionalLight(<DirectionalLightLogic>lightLogic);
    this.#logger.info(`Viewer (${this.id}): Directional light with id ${(<AbstractLight>lightLogic).id} created.`);
    this.update();
    return <DirectionalLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a hemisphere light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.groundColor the ground color of the light
   * @param properties.id the id of the light
   * @returns 
   */
  public addHemisphereLight(properties: { color?: string | number | vec3, intensity?: number, groundColor?: string | number | vec3, id?: string, name?: string }): HemisphereLight {
    this.isInitialized();
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.color, 'color', false);
    this.#inputValidator.validate(props.groundColor, 'color', false);
    this.#inputValidator.validate(props.intensity, 'positive', false);
    this.#inputValidator.validate(props.id, 'string', false);
    this.#inputValidator.validate(props.name, 'string', false);
    if(props.color !== undefined) props.color = this.#converter.toColor(props.color);
    if(props.groundColor !== undefined) props.groundColor = this.#converter.toColor(props.groundColor);
    const lightLogic = this.#renderingEngine.lightEngine.addHemisphereLight(props);
    this.#lights[(<AbstractLight>lightLogic).id] = new HemisphereLight(<HemisphereLightLogic>lightLogic);
    this.#logger.info(`Viewer (${this.id}): Hemisphere light with id ${(<AbstractLight>lightLogic).id} created.`);
    this.update();
    return <HemisphereLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a point light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.position the position of the light
   * @param properties.distance the distance of the light radiance
   * @param properties.decay the decay of the light radiance
   * @param properties.id the id of the light
   * @returns 
   */
  public addPointLight(properties: { color?: string | number | vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, id?: string, name?: string }): PointLight {
    this.isInitialized();
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.color, 'color', false);
    this.#inputValidator.validate(props.intensity, 'positive', false);
    this.#inputValidator.validate(props.id, 'string', false);
    this.#inputValidator.validate(props.position, 'vec3', false);
    this.#inputValidator.validate(props.distance, 'positive', false);
    this.#inputValidator.validate(props.decay, 'positive', false);
    this.#inputValidator.validate(props.name, 'string', false);
    if(props.color !== undefined) props.color = this.#converter.toColor(props.color);
    const lightLogic = this.#renderingEngine.lightEngine.addPointLight(props);
    this.#lights[(<AbstractLight>lightLogic).id] = new PointLight(<PointLightLogic>lightLogic);
    this.#logger.info(`Viewer (${this.id}): Point light with id ${(<AbstractLight>lightLogic).id} created.`);
    this.update();
    return <PointLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Add a spot light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.position the position of the light
   * @param properties.target the target of the light
   * @param properties.distance the distance of the light radiance
   * @param properties.decay the decay of the light radiance
   * @param properties.angle the angle of the light cone
   * @param properties.penumbra the percentage of the cone that is part of the penmubra
   * @param properties.id the id of the light
   * @returns 
   */
  public addSpotLight(properties?: { color?: string | number | vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, id?: string, name?: string }): SpotLight {
    this.isInitialized();
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.color, 'color', false);
    this.#inputValidator.validate(props.intensity, 'positive', false);
    this.#inputValidator.validate(props.id, 'string', false);
    this.#inputValidator.validate(props.position, 'vec3', false);
    this.#inputValidator.validate(props.target, 'vec3', false);
    this.#inputValidator.validate(props.distance, 'positive', false);
    this.#inputValidator.validate(props.decay, 'positive', false);
    this.#inputValidator.validate(props.angle, 'positive', false);
    this.#inputValidator.validate(props.penumbra, 'positive', false);
    this.#inputValidator.validate(props.name, 'string', false);
    if(props.color !== undefined) props.color = this.#converter.toColor(props.color);
    const lightLogic = this.#renderingEngine.lightEngine.addSpotLight(props);
    this.#lights[(<AbstractLight>lightLogic).id] = new SpotLight(<SpotLightLogic>lightLogic);
    this.#logger.info(`Viewer (${this.id}): Spot light with id ${(<AbstractLight>lightLogic).id} created.`);
    this.update();
    return <SpotLight>this.#lights[(<AbstractLight>lightLogic).id];
  }

  /**
   * Assign the camera with the specified id to the viewer.
   * 
   * @param id the id of the camera
   */
  public assignCamera(id: string): void {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string');
    this.#renderingEngine.cameraEngine.assignCamera(id);
    this.#logger.info(`Viewer (${this.id}): Camera with id ${id} assigned.`);
  }

  /**
   * Assign the light scene with the current id to the viewer.
   * 
   * @param id the id of the light scene 
   * @returns 
   */
  public assignLightScene(id: string): boolean {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string');
    if(this.lightScene === id) {
      this.#logger.info(`Viewer (${this.id}): The light scene with id ${id} was already assigned.`);
      return true;
    }
    const r = this.#renderingEngine.lightEngine.assignLightScene(id);
    if (r) this.#renderingEngine.lightScene = id;
    if (r) this.#logger.info(`Viewer (${this.id}): Assigned light scene with id ${id}.`);
    if (!r) this.#logger.info(`Viewer (${this.id}): Could not assign light scene with id ${id}.`);
    this.update();
    return r;
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
    this.isInitialized();
    this.#inputValidator.validate(type, 'enum', true, Object.values(CAMERATYPE));
    this.#inputValidator.validate(id, 'string', false);
    const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
    this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    this.#logger.info(`Viewer (${this.id}): ${cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? 'Orthographic' : 'Perspective'} camera with id ${id} created.`);
    return this.#cameras[cameraLogic.id];
  }

  /**
   * Create a new light scene.
   * An id can be provided. If not, a unique id will be created.
   * If the standard option is chosen, the default lights will be added from the start.
   * 
   * @param properties.id the id of the light scene
   * @param properties.standard the option to add the standard lights
   * @returns 
   */
  public createLightScene(properties: { id?: string, standard?: boolean }): LightScene {
    this.isInitialized();
    this.#inputValidator.validate(properties.id, 'string', false);
    this.#inputValidator.validate(properties.standard, 'boolean', false);
    const lightSceneLogic = this.#renderingEngine.lightEngine.createLightScene(properties);
    const lightScene = new LightScene(this, lightSceneLogic);
    this.#lightScenes[lightSceneLogic.id] = lightScene;
    this.#logger.info(`Viewer (${this.id}): New light scene with id ${lightSceneLogic.id} created.`);
    if(lightSceneLogic.id) this.assignLightScene(lightSceneLogic.id);
    this.update();
    return lightScene;
  }

  /**
   * Create an orthographic camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createOrthographicCamera(id?: string): Camera {
    this.#inputValidator.validate(id, 'string', false);
    this.#logger.info(`Viewer (${this.id}): Orthographic camera with id ${id} created.`);
    return this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
  }

  /**
   * Create a perspective camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createPerspectiveCamera(id?: string): Camera {
    this.#inputValidator.validate(id, 'string', false);
    this.#logger.info(`Viewer (${this.id}): Perspective camera with id ${id} created.`);
    return this.createCamera(CAMERATYPE.PERSPECTIVE, id);
  }

  /**
   * Return the camera with the specified id.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public getCamera(id?: string): Camera | null {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string', false);
    const cameraLogic = this.#renderingEngine.cameraEngine.getCamera(id);
    if (!cameraLogic) return null;
    if (!this.#cameras[cameraLogic.id]) this.#cameras[cameraLogic.id] = cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic);
    return this.#cameras[cameraLogic.id];
  }

  /**
   * Return all camera as key-value pairs with the id of the camera being the key.
   * 
   * @returns 
   */
  public getCameras(): { [key: string]: Camera } {
    this.isInitialized();
    const cameraLogic = this.#renderingEngine.cameraEngine.getCameras();
    const cameras: { [key: string]: Camera; } = {};
    for (let e in cameraLogic) {
      if (!this.#cameras[cameraLogic[e].id]) this.#cameras[cameraLogic[e].id] = cameraLogic[e].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>cameraLogic[e]) : new PerspectiveCamera(<PerspectiveCameraLogic>cameraLogic[e]);
      cameras[e] = this.#cameras[cameraLogic[e].id];
    }
    return cameras;
  }

  /**
   * Return the light with the specified id.
   * 
   * @param id the id of the light
   * @returns 
   */
  public getLight(id: string): Light {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string');
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
   * Return the id of the current light scene.
   * 
   * @returns 
   */
  public getLightScene(id?: string): LightScene {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string', false);
    if(!id)
      id = this.#renderingEngine.lightEngine.getLightScene().id;

    if (!this.#lightScenes[id]) {
      const lightSceneLogic = this.#renderingEngine.lightEngine.getLightScene(id);
      this.#lightScenes[lightSceneLogic.id] = new LightScene(this, lightSceneLogic);
    }
    return this.#lightScenes[id];
  }

  /**
   * Return the ids of all light scene in an array.
   * 
   * @returns 
   */
  public getLightScenes(): { [key: string]: LightScene } {
    this.isInitialized();
    const lightSceneLogic = this.#renderingEngine.lightEngine.getLightScenes();
    const lightScenes: { [key: string]: LightScene } = {};
    for (let l in lightSceneLogic)
      lightScenes[l] = this.getLightScene(l);
    return lightScenes;
  }

  /**
   * Return all lights as key-value pairs with the id of the light being the key.
   * 
   * @returns 
   */
  public getLights(): { [key: string]: Light } {
    this.isInitialized();
    const lightLogic = this.#renderingEngine.lightEngine.getLights();
    const lights: { [key: string]: Light } = {};
    for (let l in lightLogic)
      lights[l] = this.getLight(l);
    return lights;
  }

  /**
   * Create a screenshot for the requested type and options.
   * 
   * @param type the type as string, default is 'image/png'
   * @param quality the quality of the screenshot, default is 1
   * @returns 
   */
  public getScreenshot(type?: string, quality?: number): string {
    this.isInitialized();
    this.#inputValidator.validate(type, 'string', false);
    this.#inputValidator.validate(quality, 'factor', false);
    this.#logger.info(`Viewer (${this.id}): screenshot was requested`);
    return this.#renderingEngine.getScreenshot(type, quality);
  }

  /**
   * Return if the viewer has currently a camera assigned.
   * 
   * @returns 
   */
  public hasCamera(): boolean {
    this.isInitialized();
    return this.#renderingEngine.cameraEngine.hasCamera();
  }

  /**
   * Initialize the viewer.
   * Normally, there is no need to call this function.
   * The initialization is done on creation via the api.
   * 
   * @param properties.type the type of the viewer
   * @param properties.visibility the visibility of the viewer
   * @param properties.canvas the canvas that the viewer should use
   * @param properties.id the unique id the session should have 
   */
  public async init(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string }): Promise<void> {
    // input validation
    this.#inputValidator.validate(properties, 'object', false);
    const props = Object.assign({}, properties);
    this.#inputValidator.validate(props.type, 'enum', false, Object.values(RENDERERTYPE));
    this.#inputValidator.validate(props.visibility, 'enum', false, Object.values(VISIBILITYMODE));
    this.#inputValidator.validate(props.canvas, 'HTMLCanvasElement', false);
    this.#inputValidator.validate(props.id, 'string', false);

    const viewerId = (props && props.id) ? props.id : (<UuidGenerator>container.resolve(UuidGenerator)).create();
    props.visibility = props.visibility || VISIBILITYMODE.SESSION;
    if(props) this.#properties = { id: viewerId || this.#properties.id, canvas: props.canvas || this.#properties.canvas, visibility: props.visibility || this.#properties.visibility, type: props.type || RENDERERTYPE.STANDARD };
        
    this.#renderingEngine = new RenderingEngineThreejs(this.#properties);
    container.registerInstance('renderingEngine', this.#renderingEngine);

    // default camera
    const camera = this.createCamera(CAMERATYPE.PERSPECTIVE);
    this.assignCamera(camera.id);

    if(props.visibility === VISIBILITYMODE.SESSION && this.#stateEngine.primarySessionLoaded.resolved === true) {
      await new Promise<void>(resolve => {
        this.#stateEngine.getCustomState(this.id + '_settings_loaded').then(() => resolve())
      })
    }

    this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_INITIALIZED, { viewer: this });
    this.#initialized = true;
    return Promise.resolve();
  }

  /**
   * Remove the light with the specified id from the current light scene.
   * 
   * @param id the id of the light
   * @returns 
   */
  public removeLight(id: string): boolean {
    this.isInitialized();
    this.#inputValidator.validate(id, 'string');
    const r = this.#renderingEngine.lightEngine.removeLight(id);
    if (r) this.#logger.info(`Viewer (${this.id}): Light with id ${id} removed.`);
    if (!r) this.#logger.info(`Viewer (${this.id}): Could not remove light with id ${id}.`);
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
    this.isInitialized();
    this.#inputValidator.validate(id, 'string');
    const r = this.#renderingEngine.lightEngine.removeLightScene(id);
    if (r) this.#logger.info(`Viewer (${this.id}): Light scene with id ${id} removed.`);
    if (!r) this.#logger.info(`Viewer (${this.id}): Could not remove light scene with id ${id}.`);
    this.update();
    return r;
  }

  public reset(): void {
    this.isInitialized();
    this.#renderingEngine.reset();
  }

  public resize(width: number, height: number): void {
    this.isInitialized();
    this.#inputValidator.validate(width, 'number');
    this.#inputValidator.validate(height, 'number');
    this.#logger.info(`Viewer (${this.id}) was resized to ${width} / ${height}.`);
    this.#renderingEngine.resize(width, height);
  }

  /**
   * Update the viewer with the current changes of the scene tree.
   */
  public update(): void {
    if(!this.#renderingEngine) return;
    this.#renderingEngine.update();
    this.#logger.info(`Viewer (${this.id}) was updated.`);
    this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_UPDATED, { viewer: this });
  }

  // #endregion Public Methods (25)

  // #region Private Methods (1)

  private isInitialized() {
    if(!this.#renderingEngine) {
      this.#logger.error(`Viewer has not been initialized. Please initialize it first.`);
      throw new Error('Viewer not initialized.');
    }
  }

  // #endregion Private Methods (1)
}