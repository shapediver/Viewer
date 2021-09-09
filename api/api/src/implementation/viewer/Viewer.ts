import { RenderingEngine as RenderingEngineThreejs } from '@shapediver/viewer.rendering-engine-threejs.rendering-engine'
import {
  CAMERATYPE,
  OrthographicCamera as OrthographicCameraLogic,
  PerspectiveCamera as PerspectiveCameraLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import {
  Converter,
  EventEngine,
  EVENTTYPE,
  InputValidator,
  Logger,
  LOGGINGTOPIC,
  PerformanceEvaluator,
  SDError,
  StateEngine,
} from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container, injectable } from 'tsyringe'

import { ICamera } from '../../interfaces/viewer/camera/ICamera'
import { IOrthographicCamera } from '../../interfaces/viewer/camera/IOrthographicCamera'
import { IPerspectiveCamera } from '../../interfaces/viewer/camera/IPerspectiveCamera'
import { IViewer } from '../../interfaces/viewer/IViewer'
import { ILightScene } from '../../interfaces/viewer/lights/ILightScene'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { LightScene } from './lights/LightScene'

@injectable()
export class Viewer implements IViewer {
  // #region Properties (12)

  readonly #cameras: { [key: string]: ICamera } = {};
  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #lightScenes: { [key: string]: ILightScene } = {};
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

  #busyModeIDs: string[] = [];
  #renderingEngine!: RenderingEngineThreejs;

  // #endregion Properties (12)

  // #region Constructors (1)

  /**
   * @ignore
   * @param id 
   * @param type 
   * @param canvas 
   */
  constructor(properties: { id: string, canvas?: HTMLCanvasElement, type: RENDERERTYPE, visibility: VISIBILITYMODE, logo: string }, callbacks: any) {
    try {
      this.#renderingEngine = new RenderingEngineThreejs(properties);
      container.registerInstance('renderingEngine', this.#renderingEngine);

      if (!this.camera)
        this.createCamera(CAMERATYPE.PERSPECTIVE, 'standard');

      this.update();

      callbacks.close = async (): Promise<boolean> => {
        const closeResult = await this.#renderingEngine.close();
        this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CLOSED, { viewerId: properties.id });

        if (!closeResult) this.#logger.warn(LOGGINGTOPIC.VIEWER, `Viewer(${properties.id}): Was not able to close viewer completely, please disregard this viewer.`);
        return closeResult;
      }
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId: properties.id });
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${properties.id}).constructor: Viewer created.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${properties.id}).constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (44)

  /**
   * Getter ambientOcclusion
   */
  public get ambientOcclusion(): boolean {
    return this.#renderingEngine.ambientOcclusion;
  }

  /**
   * Setter ambientOcclusion
   */
  public set ambientOcclusion(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion: Updating AmbientOcclusion to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion`, value, 'boolean');
      this.#renderingEngine.ambientOcclusion = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion: ambientOcclusion was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).ambientOcclusion: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter automaticResizing
   */
  public get automaticResizing(): boolean {
    return this.#renderingEngine.automaticResizing;
  }

  /**
   * Setter automaticResizing
   */
  public set automaticResizing(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing: Updating AutomaticResizing to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing`, value, 'boolean');
      this.#renderingEngine.automaticResizing = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing: automaticResizing was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).automaticResizing: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter beautyRenderBlendingDuration
   */
  public get beautyRenderBlendingDuration(): number {
    return this.#renderingEngine.beautyRenderBlendingDuration;
  }

  /**
   * Setter beautyRenderBlendingDuration
   */
  public set beautyRenderBlendingDuration(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration: Updating RenderBlendingDuration to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration`, value, 'positive');
      this.#renderingEngine.beautyRenderBlendingDuration = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration: beautyRenderBlendingDuration was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).beautyRenderBlendingDuration: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter beautyRenderDelay
   */
  public get beautyRenderDelay(): number {
    return this.#renderingEngine.beautyRenderDelay;
  }

  /**
   * Setter beautyRenderDelay
   */
  public set beautyRenderDelay(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay: Updating BeautyRenderDelay to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay`, value, 'positive');
      this.#renderingEngine.beautyRenderDelay = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay: beautyRenderDelay was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).beautyRenderDelay: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter blur
   */
  public get blur(): boolean {
    return this.#renderingEngine.blur;
  }

  /**
   * Setter blur
   */
  public set blur(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur: Updating Blur to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur`, value, 'boolean');
      this.#renderingEngine.blur = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur: blur was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).blur: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter blurSceneWhenBusy
   */
  public get blurSceneWhenBusy(): boolean {
    return this.#renderingEngine.blurSceneWhenBusy;
  }

  /**
   * Setter blurSceneWhenBusy
   */
  public set blurSceneWhenBusy(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy: Updating BlurSceneWhenBusy to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy`, value, 'boolean');
      this.#renderingEngine.blurSceneWhenBusy = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy: blurSceneWhenBusy was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).blurSceneWhenBusy: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter camera
   */
  public get camera(): ICamera | null {
    if (this.#renderingEngine.cameraEngine.camera)
      return this.cameras[this.#renderingEngine.cameraEngine.camera.id];
    return null;
  }

  /**
   * Getter cameras
   */
  public get cameras(): { [key: string]: ICamera } {
    // add new cameras
    for (let c in this.#renderingEngine.cameraEngine.cameras) {
      if (!this.#cameras[c])
        this.#cameras[c] = this.#renderingEngine.cameraEngine.cameras[c].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this) : new PerspectiveCamera(<PerspectiveCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this);
    }

    // delete cameras that don't exist
    for (let c in this.#cameras) {
      if (!this.#renderingEngine.cameraEngine.cameras)
        delete this.#cameras[c];
    }
    return this.#cameras;
  }

  /**
   * Getter clearAlpha
   */
  public get clearAlpha(): number {
    return this.#renderingEngine.clearAlpha;
  }

  /**
   * Setter clearAlpha
   */
  public set clearAlpha(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha: Updating ClearAlpha to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha`, value, 'factor');
      this.#renderingEngine.clearAlpha = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha: clearAlpha was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).clearAlpha: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter clearColor
   */
  public get clearColor(): string | number | vec3 {
    return this.#renderingEngine.clearColor;
  }

  /**
   * Setter clearColor
   */
  public set clearColor(value: string | number | vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor: Updating ClearColor to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor`, value, 'color');
      this.#renderingEngine.clearColor = this.#converter.toColor(value);
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor: clearColor was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).clearColor: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter environmentMap
   */
  public get environmentMap(): string | string[] {
    return this.#renderingEngine.environmentMap;
  }

  /**
   * Setter environmentMap
   */
  public set environmentMap(value: string | string[]) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap: Updating EnvironmentMap to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap`, value, 'cubeMap');
      this.#renderingEngine.environmentMap = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap: environmentMap was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).environmentMap: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter environmentMapAsBackground
   */
  public get environmentMapAsBackground(): boolean {
    return this.#renderingEngine.environmentMapAsBackground;
  }

  /**
   * Setter environmentMapAsBackground
   */
  public set environmentMapAsBackground(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground: Updating EnvironmentMapAsBackground to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground`, value, 'boolean');
      this.#renderingEngine.environmentMapAsBackground = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground: environmentMapAsBackground was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).environmentMapAsBackground: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter environmentMapResolution
   */
  public get environmentMapResolution(): string {
    return this.#renderingEngine.environmentMapResolution;
  }

  /**
   * Setter environmentMapResolution
   */
  public set environmentMapResolution(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution: Updating EnvironmentMapResolution to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution`, value, 'string');
      this.#renderingEngine.environmentMapResolution = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution: environmentMapResolution was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).environmentMapResolution: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter gridVisibility
   */
  public get gridVisibility(): boolean {
    return this.#renderingEngine.gridVisibility;
  }

  /**
   * Setter gridVisibility
   */
  public set gridVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility: Updating GridVisibility to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility`, value, 'boolean');
      this.#renderingEngine.gridVisibility = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility: gridVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).gridVisibility: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter groundPlaneVisibility
   */
  public get groundPlaneVisibility(): boolean {
    return this.#renderingEngine.groundPlaneVisibility;
  }

  /**
   * Setter groundPlaneVisibility
   */
  public set groundPlaneVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility: Updating GroundPlaneVisibility to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility`, value, 'boolean');
      this.#renderingEngine.groundPlaneVisibility = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility: groundPlaneVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).groundPlaneVisibility: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter id
   */
  public get id(): string {
    if(!this.#renderingEngine) return '';
    return this.#renderingEngine.id;
  }

  /**
   * Getter lightScene
   */
  public get lightScene(): ILightScene | null {
    if (this.#renderingEngine.lightEngine.lightScene)
      return this.lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
    return null;
  }

  /**
   * Getter lightSceneId
   */
  public get lightSceneId(): string {
    if (this.#renderingEngine.lightEngine.lightScene)
      return this.#renderingEngine.lightEngine.lightScene.id;
    return '';
  }

  /**
   * Setter lightSceneId
   */
  public set lightSceneId(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene: Updating LightScene to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene`, value, 'string');
      if (this.assignLightScene(value)) {
        this.#renderingEngine.lightScene = value;
        this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene: lightScene was set to: ${value}`);
      }
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).lightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter lightScenes
   */
  public get lightScenes(): { [key: string]: ILightScene } {
    // add new lightScenes
    for (let l in this.#renderingEngine.lightEngine.lightScenes) {
      if (!this.#lightScenes[l])
        this.#lightScenes[l] = new LightScene(this.#renderingEngine.lightEngine.lightScenes[l], this);
    }

    // delete lightScenes that don't exist
    for (let l in this.#lightScenes) {
      if (!this.#renderingEngine.lightEngine.lightScenes[l])
        delete this.#lightScenes[l];
    }
    return this.#lightScenes;
  }

  /**
   * Getter pointSize
   */
  public get pointSize(): number {
    return this.#renderingEngine.pointSize;
  }

  /**
   * Setter pointSize
   */
  public set pointSize(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize: Updating PointSize to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize`, value, 'positive');
      this.#renderingEngine.pointSize = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize: pointSize was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).pointSize: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter renderingSettings
   */
  public get renderingSettings(): {
    physicallyCorrectLights: boolean,
    envMapIntensity: number,
    envMapIntensityGroundPlane: number,
    groundPlaneColor: string,
    toneMapping: 0 | 1 | 2 | 3 | 4,
    toneMappingExposure: number,
    textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
    outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
  } {
    return this.#renderingEngine.renderingSettings;
  }

  /**
   * Setter renderingSettings
   */
  public set renderingSettings(value: {
    physicallyCorrectLights: boolean,
    envMapIntensity: number,
    envMapIntensityGroundPlane: number,
    groundPlaneColor: string,
    toneMapping: 0 | 1 | 2 | 3 | 4,
    toneMappingExposure: number,
    textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
    outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
  }) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).renderingSettings: Rendering settings were set to ${JSON.stringify(value)}.`);
      this.#renderingEngine.renderingSettings = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).renderingSettings: rendering settings were set to: ${JSON.stringify(value)}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).renderingSettings: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter shadows
   */
  public get shadows(): boolean {
    return this.#renderingEngine.shadows;
  }

  /**
   * Setter shadows
   */
  public set shadows(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows: Updating Shadows to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows`, value, 'boolean');
      this.#renderingEngine.shadows = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows: shadows was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).shadows: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter show
   */
  public get show(): boolean {
    return this.#renderingEngine.show;
  }

  /**
   * Setter show
   */
  public set show(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show: Updating Show to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show`, value, 'boolean');
      this.#renderingEngine.show = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show: show was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).show: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter showStatistics
   */
  public get showStatistics(): boolean {
    return this.#renderingEngine.showStatistics;
  }

  /**
   * Setter 
   */
  public set showStatistics(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics: Updating ShowStatistics to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics`, value, 'boolean');
      this.#renderingEngine.showStatistics = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics: showStatistics was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).showStatistics: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Accessors (44)

  // #region Public Methods (16)

  /**
   * Assign the camera with the specified id to the viewer.
   * 
   * @param id the id of the camera
   */
  public assignCamera(id: string): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Assigning Camera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera`, id, 'string');
      this.#renderingEngine.cameraEngine.assignCamera(id);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Camera with id ${id} assigned.`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).assignCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Assign the light scene with the current id to the viewer.
   * 
   * @param id the id of the light scene 
   * @returns 
   */
  public assignLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigning LightScene with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene`, id, 'string');
      if (this.lightScene && this.lightScene.id === id) {
        this.#logger.warn(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: The light scene with id ${id} was already assigned.`);
        return true;
      }
      const r = this.#renderingEngine.lightEngine.assignLightScene(id);
      if (r) this.#renderingEngine.lightScene = id;
      if (r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigned light scene with id ${id}.`);
      if (!r) this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(`Viewer(${this.id}).assignLightScene: Could not assign light scene with id ${id}.`));
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).assignLightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a camera with the specified type.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param type the type of the camera
   * @param id the id of the camera
   * @returns 
   */
  public createCamera(type: CAMERATYPE, id?: string): ICamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: Creating Camera with id ${id} and type ${type}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, type, 'enum', true, Object.values(CAMERATYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, id, 'string', false);
      const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: ${cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? 'Orthographic' : 'Perspective'} camera with id ${id} created.`);
      this.assignCamera(cameraLogic.id);
      return this.cameras[cameraLogic.id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createCamera: Something unexpected happened.`, true)
    }
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
  public createLightScene(properties?: { name?: string, standard?: boolean }): ILightScene {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: Creating LightScene with properties ${properties}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.name, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.standard, 'boolean', false);
      const lightSceneLogic = this.#renderingEngine.lightEngine.createLightScene(props);
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: New light scene with id ${lightSceneLogic.id} created.`);
      if (lightSceneLogic.id) this.assignLightScene(lightSceneLogic.id);
      this.update();
      return this.lightScenes[lightSceneLogic.id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).createLightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Create an orthographic camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createOrthographicCamera(id?: string): IOrthographicCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Creating OrthographicCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera`, id, 'string', false);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Orthographic camera with id ${id} created.`);
      return <IOrthographicCamera>this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createOrthographicCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a perspective camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createPerspectiveCamera(id?: string): IPerspectiveCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Creating PerspectiveCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera`, id, 'string', false);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Perspective camera with id ${id} created.`);
      return <IPerspectiveCamera>this.createCamera(CAMERATYPE.PERSPECTIVE, id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createPerspectiveCamera: Something unexpected happened.`, true)
    }
  }

  public deregisterBusyMode(value: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode: Deregistering busy mode for id ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode`, value, 'string');

      if (!this.#busyModeIDs.includes(value)) return false;
      this.#busyModeIDs.splice(this.#busyModeIDs.indexOf(value), 1);

      if (this.#busyModeIDs.length === 0)
        this.#renderingEngine.busy = false;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode: Busy mode was deregistered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).deregisterBusyMode: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a screenshot for the requested type and options.
   * 
   * @param type the type as string, default is 'image/png'
   * @param quality the quality of the screenshot, default is 1
   * @returns 
   */
  public getScreenshot(type?: string, quality?: number): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: Getting getScreenshot with type ${type} and quality ${quality}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, type, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, quality, 'factor', false);
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: screenshot was requested`);
      return this.#renderingEngine.getScreenshot(type, quality);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).getScreenshot: Something unexpected happened.`, true)
    }
  }

  public registerBusyMode(value: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode: Registering busy mode for id ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode`, value, 'string');

      if (this.#busyModeIDs.includes(value)) return false;
      this.#busyModeIDs.push(value);

      if (this.blurSceneWhenBusy === true)
        this.#renderingEngine.busy = true;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode: Busy mode was registered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).registerBusyMode: Something unexpected happened.`, true)
    }
  }

  /**
   * Remove the camera with the specified id.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public removeCamera(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Removing Camera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera`, id, 'string');
      const r = this.#renderingEngine.cameraEngine.removeCamera(id);
      if (r) this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Camera with id ${id} removed.`);
      if (!r) this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Could not remove camera with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).removeCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Remove the light scene with the specified id.
   * 
   * @param id the id of the light scene
   * @returns 
   */
  public removeLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Removing LightScene with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene`, id, 'string');
      const r = this.#renderingEngine.lightEngine.removeLightScene(id);
      if (r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Light scene with id ${id} removed.`);
      if (!r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Could not remove light scene with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).removeLightScene: Something unexpected happened.`, true)
    }
  }

  public reset(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).reset: Resetting Viewer.`);
      this.#renderingEngine.reset();
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).reset: Something unexpected happened.`, true)
    }
  }

  public resize(width: number, height: number): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resizing Viewer to ${width} / ${height}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, width, 'number');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, height, 'number');
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resized Viewer to ${width} / ${height}.`);
      this.#renderingEngine.resize(width, height);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).resize: Something unexpected happened.`, true)
    }
  }

  /**
   * Update the viewer with the current changes of the scene tree.
   */
  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updating Viewer.`);
      if (!this.#renderingEngine) return;
      this.#renderingEngine.update();
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updated viewer.`);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_UPDATED, { viewerId: this.id });
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).update: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (16)
}