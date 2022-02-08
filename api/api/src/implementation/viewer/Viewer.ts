import { RenderingEngine as RenderingEngineThreejs } from '@shapediver/viewer.rendering-engine-threejs.standard'
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
  IDomEventListener,
  InputValidator,
  Logger,
  LOGGINGTOPIC,
  PerformanceEvaluator,
  ShapeDiverBackendError,
  ShapeDiverViewerError,
  ShapeDiverViewerLightError,
  StateEngine,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container, injectable } from 'tsyringe'
import { AnimationData, IEnvironmentEvent, SDTFAttributeVisualizationData, SDTFItemData, SDTFOverview } from '@shapediver/viewer.shared.types'

import { ICamera } from '../../interfaces/viewer/camera/ICamera'
import { IOrthographicCamera } from '../../interfaces/viewer/camera/IOrthographicCamera'
import { IPerspectiveCamera } from '../../interfaces/viewer/camera/IPerspectiveCamera'
import { ILightScene } from '../../interfaces/viewer/lights/ILightScene'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { LightScene } from './lights/LightScene'
import { ISDObject, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { IViewer } from '../../interfaces/viewer/IViewer'

@injectable()
export class Viewer implements IViewer {
  // #region Properties (14)

  readonly #cameras: { [key: string]: ICamera } = {};
  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #lightScenes: { [key: string]: ILightScene } = {};
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
  readonly #sceneTree: Tree = <Tree>container.resolve(Tree);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  #busyModeIDs: string[] = [];
  #flagsCameraFreeze: string[] = [];
  #flagsContinuousRendering: string[] = [];
  #flagsShadowMapUpdate: string[] = [];
  #renderingEngine!: RenderingEngineThreejs;

  // #endregion Properties (14)

  // #region Constructors (1)

  /**
   * @ignore
   * @param id 
   * @param type 
   * @param canvas 
   */
  constructor(properties: { id: string, canvas?: HTMLCanvasElement, visibility: VISIBILITYMODE, logo: string }, callbacks: any) {
    try {
      this.#renderingEngine = new RenderingEngineThreejs(properties);
      container.registerInstance('renderingEngine', this.#renderingEngine);

      if (!this.camera)
        this.createCamera(CAMERATYPE.PERSPECTIVE);

      this.update();

      callbacks.close = async (): Promise<boolean> => {
        const closeResult = await this.#renderingEngine.close();
        this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CLOSED, { viewerId: properties.id });

        if (!closeResult) this.#logger.warn(LOGGINGTOPIC.VIEWER, `Viewer(${properties.id}): Was not able to close viewer completely, please disregard this viewer.`);
        return closeResult;
      }

      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${properties.id}).constructor: Viewer created.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${properties.id}).constructor`, e);
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (47)

  public get ambientOcclusion(): boolean {
    return this.#renderingEngine.ambientOcclusion;
  }

  public set ambientOcclusion(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion: Updating AmbientOcclusion to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion`, value, 'boolean');
      this.#renderingEngine.ambientOcclusion = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion: ambientOcclusion was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusion`, e);
    }
  }

  public get ambientOcclusionIntensity(): number {
    return this.#renderingEngine.ambientOcclusionIntensity;
  }

  public set ambientOcclusionIntensity(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusionIntensity: Updating ambientOcclusionIntensity to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusionIntensity`, value, 'factor');
      this.#renderingEngine.ambientOcclusionIntensity = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusionIntensity: ambientOcclusionIntensity was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).ambientOcclusionIntensity`, e);
    }
  }

  public get animations(): AnimationData[] {
    return this.#renderingEngine.animations;
  }

  public get automaticResizing(): boolean {
    return this.#renderingEngine.automaticResizing;
  }

  public set automaticResizing(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing: Updating AutomaticResizing to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing`, value, 'boolean');
      this.#renderingEngine.automaticResizing = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing: automaticResizing was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).automaticResizing`, e);
    }
  }

  public get beautyRenderBlendingDuration(): number {
    return this.#renderingEngine.beautyRenderBlendingDuration;
  }

  public set beautyRenderBlendingDuration(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration: Updating RenderBlendingDuration to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration`, value, 'positive');
      this.#renderingEngine.beautyRenderBlendingDuration = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration: beautyRenderBlendingDuration was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderBlendingDuration`, e);
    }
  }

  public get beautyRenderDelay(): number {
    return this.#renderingEngine.beautyRenderDelay;
  }

  public set beautyRenderDelay(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay: Updating BeautyRenderDelay to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay`, value, 'positive');
      this.#renderingEngine.beautyRenderDelay = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay: beautyRenderDelay was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).beautyRenderDelay`, e);
    }
  }

  public get blur(): boolean {
    return this.#renderingEngine.blur;
  }

  public set blur(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur: Updating Blur to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur`, value, 'boolean');
      this.#renderingEngine.blur = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur: blur was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blur`, e);
    }
  }

  public get blurSceneWhenBusy(): boolean {
    return this.#renderingEngine.blurSceneWhenBusy;
  }

  public set blurSceneWhenBusy(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy: Updating BlurSceneWhenBusy to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy`, value, 'boolean');
      this.#renderingEngine.blurSceneWhenBusy = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy: blurSceneWhenBusy was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy`, e);
    }
  }

  public get camera(): ICamera | null {
    if (this.#renderingEngine.cameraEngine.camera)
      return this.cameras[this.#renderingEngine.cameraEngine.camera.id];
    return null;
  }

  public get cameras(): { [key: string]: ICamera } {
    // add new cameras
    for (let c in this.#renderingEngine.cameraEngine.cameras) {
      if (!this.#cameras[c])
        this.#cameras[c] = this.#renderingEngine.cameraEngine.cameras[c].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this) : new PerspectiveCamera(<PerspectiveCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this);
    }

    // delete cameras that don't exist
    for (let c in this.#cameras) {
      if (!this.#renderingEngine.cameraEngine.cameras[c])
        delete this.#cameras[c];
    }
    return this.#cameras;
  }

  public get canvas(): HTMLCanvasElement {
    return this.#renderingEngine.canvas.canvasElement;
  }

  public get clearAlpha(): number {
    return this.#renderingEngine.clearAlpha;
  }

  public set clearAlpha(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha: Updating ClearAlpha to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha`, value, 'factor');
      this.#renderingEngine.clearAlpha = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha: clearAlpha was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearAlpha`, e);
    }
  }

  public get clearColor(): string | number | vec3 {
    return this.#renderingEngine.clearColor;
  }

  public set clearColor(value: string | number | vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor: Updating ClearColor to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor`, value, 'color');
      this.#renderingEngine.clearColor = this.#converter.toColor(value);
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor: clearColor was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).clearColor`, e);
    }
  }

  public get convertSDTFItemToVisualizationData(): ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined {
    return this.#renderingEngine.convertSDTFItemToVisualizationData;
  }

  public set convertSDTFItemToVisualizationData(value: ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined) {
    this.#renderingEngine.convertSDTFItemToVisualizationData = value;
  }

  public get environmentMap(): string | string[] {
    return this.#renderingEngine.environmentMap;
  }

  public set environmentMap(value: string | string[]) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap: Updating EnvironmentMap to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap`, value, 'cubeMap');

      this.#stateEngine.viewers[this.id].environmentMapLoaded.then(() => {
        this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap: environmentMap was set to: ${value}`);
        this.update();
      })
    
      this.#renderingEngine.environmentMap = value;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMap`, e);
    }
  }

  public get environmentMapAsBackground(): boolean {
    return this.#renderingEngine.environmentMapAsBackground;
  }

  public set environmentMapAsBackground(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground: Updating EnvironmentMapAsBackground to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground`, value, 'boolean');
      this.#renderingEngine.environmentMapAsBackground = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground: environmentMapAsBackground was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapAsBackground`, e);
    }
  }

  public get environmentMapResolution(): string {
    return this.#renderingEngine.environmentMapResolution;
  }

  public set environmentMapResolution(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution: Updating EnvironmentMapResolution to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution`, value, 'string');
      this.#renderingEngine.environmentMapResolution = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution: environmentMapResolution was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).environmentMapResolution`, e);
    }
  }

  public get gridVisibility(): boolean {
    return this.#renderingEngine.gridVisibility;
  }

  public set gridVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility: Updating GridVisibility to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility`, value, 'boolean');
      this.#renderingEngine.gridVisibility = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility: gridVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).gridVisibility`, e);
    }
  }

  public get groundPlaneVisibility(): boolean {
    return this.#renderingEngine.groundPlaneVisibility;
  }

  public set groundPlaneVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility: Updating GroundPlaneVisibility to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility`, value, 'boolean');
      this.#renderingEngine.groundPlaneVisibility = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility: groundPlaneVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).groundPlaneVisibility`, e);
    }
  }

  public get id(): string {
    if(!this.#renderingEngine) return '';
    return this.#renderingEngine.id;
  }

  public get lightScene(): ILightScene | null {
    if (this.#renderingEngine.lightEngine.lightScene)
      return this.lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
    return null;
  }

  public get lightSceneId(): string {
    if (this.#renderingEngine.lightEngine.lightScene)
      return this.#renderingEngine.lightEngine.lightScene.id;
    return '';
  }

  public set lightSceneId(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene: Updating LightScene to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene`, value, 'string');
      if (this.assignLightScene(value)) {
        this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).lightScene: lightScene was set to: ${value}`);
      }
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).lightScene`, e);
    }
  }

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

  public get pointSize(): number {
    return this.#renderingEngine.pointSize;
  }

  public set pointSize(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize: Updating PointSize to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize`, value, 'positive');
      this.#renderingEngine.pointSize = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize: pointSize was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).pointSize`, e);
    }
  }

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
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).renderingSettings: rendering settings were set to: ${JSON.stringify(value)}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).renderingSettings`, e);
    }
  }

  public get shadows(): boolean {
    return this.#renderingEngine.shadows;
  }

  public set shadows(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows: Updating Shadows to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows`, value, 'boolean');
      this.#renderingEngine.shadows = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows: shadows was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).shadows`, e);
    }
  }

  public get show(): boolean {
    return this.#renderingEngine.show;
  }

  public set show(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show: Updating Show to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show`, value, 'boolean');
      this.#renderingEngine.show = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show: show was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).show`, e);
    }
  }

  public get showStatistics(): boolean {
    return this.#renderingEngine.showStatistics;
  }

  public set showStatistics(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics: Updating ShowStatistics to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics`, value, 'boolean');
      this.#renderingEngine.showStatistics = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics: showStatistics was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).showStatistics`, e);
    }
  }

  public get type(): RENDERERTYPE {
    return this.#renderingEngine.type;
  }

  public set type(value: RENDERERTYPE) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).type: Updating Type to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).type`, value, 'enum', true, Object.values(RENDERERTYPE));
      this.#renderingEngine.type = value;
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy: type was set to: ${value}`);
      this.#sceneTree.root.updateVersion();
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).blurSceneWhenBusy`, e);
    }
  }

  // #endregion Public Accessors (47)

  // #region Public Methods (24)

  public addCameraFreezeFlag(): string {
    const token = this.#uuidGenerator.create();
    this.#flagsCameraFreeze.push(token);
    this.#renderingEngine.cameraEngine.deactivateCameraEvents();
    return token;
  }

  public addCanvasEventListener(listener: IDomEventListener): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).addCanvasEventListener: Adding new canvas event listener.`);
      return this.#renderingEngine.domEventEngine.addDomEventListener(listener);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).addCanvasEventListener`, e);
    }
  }

  public addContinuousRenderingFlag(): string {
    const token = this.#uuidGenerator.create();
    this.#flagsContinuousRendering.push(token);
    this.#renderingEngine.continuousRendering = true;
    return token;
  }

  public addShadowMapUpdateFlag(): string {
    const token = this.#uuidGenerator.create();
    this.#flagsShadowMapUpdate.push(token);
    this.#renderingEngine.continuousShadowMapUpdate = true;
    return token;
  }

  public assignCamera(id: string): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Assigning Camera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera`, id, 'string');
      this.#renderingEngine.cameraEngine.assignCamera(id);
      this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Camera with id ${id} assigned.`);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).assignCamera`, e);
    }
  }

  public assignLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigning LightScene with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene`, id, 'string');
      if (this.lightScene && this.lightScene.id === id) {
        this.#logger.warn(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: The light scene with id ${id} was already assigned.`);
        return true;
      }
      const r = this.#renderingEngine.lightEngine.assignLightScene(id);
      if (r) this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigned light scene with id ${id}.`);
      if (!r) {
        const error = new ShapeDiverViewerLightError(`Viewer(${this.id}).assignLightScene: Could not assign light scene.`);
        throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).assignLightScene`, error);
      }
      this.update();
      return r;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).assignLightScene`, e);
    }
  }

  public createCamera(type: CAMERATYPE, id?: string): ICamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: Creating Camera with id ${id} and type ${type}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, type, 'enum', true, Object.values(CAMERATYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, id, 'string', false);
      const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
      this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: ${cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? 'Orthographic' : 'Perspective'} camera with id ${id} created.`);
      this.assignCamera(cameraLogic.id);
      return this.cameras[cameraLogic.id];
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).createCamera`, e);
    }
  }

  public createLightScene(properties?: { name?: string, standard?: boolean }): ILightScene {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: Creating LightScene with properties ${properties}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.name, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.standard, 'boolean', false);
      const lightSceneLogic = this.#renderingEngine.lightEngine.createLightScene(props);
      this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: New light scene with id ${lightSceneLogic.id} created.`);
      if (lightSceneLogic.id) this.assignLightScene(lightSceneLogic.id);
      this.update();
      return this.lightScenes[lightSceneLogic.id];
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).createLightScene`, e);
    }
  }

  public createOrthographicCamera(id?: string): IOrthographicCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Creating OrthographicCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera`, id, 'string', false);
      this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Orthographic camera with id ${id} created.`);
      return <IOrthographicCamera>this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).createOrthographicCamera`, e);
    }
  }

  public createPerspectiveCamera(id?: string): IPerspectiveCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Creating PerspectiveCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera`, id, 'string', false);
      this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Perspective camera with id ${id} created.`);
      return <IPerspectiveCamera>this.createCamera(CAMERATYPE.PERSPECTIVE, id);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).createPerspectiveCamera`, e);
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
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode: Busy mode was deregistered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode`, e);
    }
  }

  public getScreenshot(type?: string, quality?: number): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: Getting getScreenshot with type ${type} and quality ${quality}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, type, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, quality, 'factor', false);
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: screenshot was requested`);
      return this.#renderingEngine.getScreenshot(type, quality);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, e);
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
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode: Busy mode was registered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode`, e);
    }
  }

  public removeCamera(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Removing Camera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera`, id, 'string');
      const r = this.#renderingEngine.cameraEngine.removeCamera(id);
      if (r) this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Camera with id ${id} removed.`);
      if (!r) this.#logger.debug(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Could not remove camera with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).removeCamera`, e);
    }
  }

  public removeCameraFreezeFlag(token: string): boolean {
    if (!this.#flagsCameraFreeze.includes(token)) return false;
    this.#flagsCameraFreeze.splice(this.#flagsCameraFreeze.indexOf(token), 1);
    if (this.#flagsCameraFreeze.length === 0)
      this.#renderingEngine.cameraEngine.activateCameraEvents();
    return true;
  }

  public removeCanvasEventListener(token: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).removeCanvasEventListener: Removing canvas event listener.`);
      return this.#renderingEngine.domEventEngine.removeDomEventListener(token);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).removeCanvasEventListener`, e);
    }
  }

  public removeContinuousRenderingFlag(token: string): boolean {
    if (!this.#flagsContinuousRendering.includes(token)) return false;
    this.#flagsContinuousRendering.splice(this.#flagsContinuousRendering.indexOf(token), 1);
    if (this.#flagsContinuousRendering.length === 0)
      this.#renderingEngine.continuousRendering = false;
    return true;
  }

  public removeLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Removing LightScene with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene`, id, 'string');
      const r = this.#renderingEngine.lightEngine.removeLightScene(id);
      if (r) this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Light scene with id ${id} removed.`);
      if (!r) this.#logger.debug(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Could not remove light scene with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).removeLightScene`, e);
    }
  }

  public removeShadowMapUpdateFlag(token: string): boolean {
    if (!this.#flagsShadowMapUpdate.includes(token)) return false;
    this.#flagsShadowMapUpdate.splice(this.#flagsShadowMapUpdate.indexOf(token), 1);
    if (this.#flagsShadowMapUpdate.length === 0)
      this.#renderingEngine.continuousShadowMapUpdate = false;
    return true;
  }

  public render(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).render: Rendering Viewer.`);
      this.#renderingEngine.renderingManager.render();
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).render`, e);
    }  
  }

  public reset(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).reset: Resetting Viewer.`);
      this.#renderingEngine.reset();
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).reset`, e);
    }
  }

  public resize(width: number, height: number): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resizing Viewer to ${width} / ${height}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, width, 'number');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, height, 'number');
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resized Viewer to ${width} / ${height}.`);
      this.#renderingEngine.resize(width, height);
      this.update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, e);
    }
  }

  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updating Viewer.`);
      if (!this.#renderingEngine) return;
      this.#renderingEngine.update();
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updated viewer.`);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_UPDATED, { viewerId: this.id });
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update`, e);
    }
  }

  public updateNode(node: TreeNode): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateNode: Updating Node.`);
      if (!this.#renderingEngine) return;
      this.#renderingEngine.sceneTreeManager.updateNode(node, node.transformedNodes[this.id]);
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateNode: Updated Node.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateNode`, e);
    }
  }

  public applySettings(sections: { camera?: boolean, light?: boolean, scene?: boolean, environment?: boolean } = { camera: true, light: true, scene: true, environment: true }) {
    this.#renderingEngine.applySettings(sections);
  }

  // #endregion Public Methods (24)
}