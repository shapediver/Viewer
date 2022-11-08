import * as THREE from 'three'
import { vec2, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'
import {
  CameraEngine,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { CanvasEngine, ICanvas } from '@shapediver/viewer.rendering-engine.canvas-engine'
import { ITree, ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree'
import { LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import {
  BUSY_MODE_DISPLAY,
  FLAG_TYPE,
  SPINNER_POSITIONING,
  RENDERER_TYPE,
  SESSION_SETTINGS_MODE,
  TEXTURE_ENCODING,
  TONE_MAPPING,
  VISIBILITY_MODE,
} from '@shapediver/viewer.rendering-engine.rendering-engine'
import {
  Converter,
  DomEventEngine,
  EventEngine,
  EVENTTYPE,
  Logger,
  LOGGING_TOPIC,
  SettingsEngine,
  ShapeDiverViewerArError,
  StateEngine,
  SystemInfo,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import {
  AnimationData,
  ISDTFOverviewData,
  ISDTFAttributeVisualizationData,
  ISDTFOverview,
  ISDTFItemData,
  SDTFOverviewData,
  ITaskEvent,
  TASK_TYPE,
  IAnimationData,
  IGeometryData,
} from '@shapediver/viewer.shared.types'

import { SceneTreeManager } from './managers/SceneTreeManager'
import { RenderingManager } from './managers/RenderingManager'
import { MaterialLoader } from './loaders/MaterialLoader'
import { EnvironmentMapLoader } from './loaders/EnvironmentMapLoader'
import { GeometryLoader } from './loaders/GeometryLoader'
import { LightLoader } from './loaders/LightLoader'
import { HTMLElementAnchorLoader } from './loaders/HTMLElementAnchorLoader'
import { BeautyRenderingManager } from './managers/BeautyRenderingManager'
import { EnvironmentGeometryManager } from './managers/EnvironmentGeometryManager'
import { SceneTracingManager } from './managers/SceneTracingManager'
import { CameraManager } from './managers/CameraManager'
import { IRenderingEngineThreeJS } from './interfaces/IRenderingEngine'
import { AnimationManager } from './managers/AnimationManager'

export class RenderingEngine implements IRenderingEngineThreeJS {
  // #region Properties (61)

  // managers
  private readonly _animationManager: AnimationManager;
  private readonly _beautyRenderingManager: BeautyRenderingManager;
  // engines
  private readonly _cameraEngine: CameraEngine;
  private readonly _cameraManager: CameraManager;
  // viewer essentials
  private readonly _canvas: ICanvas;
  private readonly _canvasEngine: CanvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
  // utils
  private readonly _converter: Converter = <Converter>container.resolve(Converter);
  private readonly _domEventEngine: DomEventEngine;
  private readonly _environmentGeometryManager: EnvironmentGeometryManager;
  private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);
  // loaders
  private readonly _environmentMapLoader: EnvironmentMapLoader;
  private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  private readonly _geometryLoader: GeometryLoader;
  private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
  // constructor properties
  private readonly _branding: {
    logo: string | null,
    backgroundColor: string,
    busyModeSpinner: string,
    busyModeDisplay: BUSY_MODE_DISPLAY,
    spinnerPositioning: SPINNER_POSITIONING
  };
  private readonly _id: string;
  private readonly _lightEngine: LightEngine;
  private readonly _lightLoader: LightLoader;
  private readonly _logger: Logger = <Logger>container.resolve(Logger);
  private readonly _materialLoader: MaterialLoader;
  private readonly _renderingManager: RenderingManager;
  private readonly _sceneTracingManager: SceneTracingManager;
  private readonly _sceneTreeManager: SceneTreeManager;
  private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  private readonly _tree: ITree = <ITree>container.resolve(Tree);
  private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  private readonly _visibility: VISIBILITY_MODE;

  // settings
  private _ambientOcclusion: boolean = true;
  private _ambientOcclusionIntensity: number = 0.1;
  private _arRotation: vec3 = vec3.create();
  private _arScale: vec3 = vec3.fromValues(1, 1, 1);
  private _arTranslation: vec3 = vec3.create();
  private _automaticResizing: boolean = true;
  private _beautyRenderBlendingDuration: number = 1500;
  private _beautyRenderDelay: number = 50;
  private _busy: boolean = false;
  private _busyModeDisplay: BUSY_MODE_DISPLAY = BUSY_MODE_DISPLAY.SPINNER;
  private _clearAlpha: number = 1.0;
  private _clearColor: string = '#ffffff';
  // viewer global vars
  private _closed: boolean = false;
  private _enableAR: boolean = true;
  private _environmentMap: string | string[] = 'none';
  private _environmentMapAsBackground: boolean = false;
  private _environmentMapResolution: string = '1024';
  private _gridVisibility: boolean = true;
  private _groundPlaneVisibility: boolean = true;
  private _groundPlaneShadowVisibility: boolean = false;
  private _lights: boolean = true;
  private _logoDivElement: HTMLDivElement;
  private _pointSize: number = 1.0;
  private _renderer: THREE.WebGLRenderer;
  private _sessionSettingsId?: string;
  private _sessionSettingsMode: SESSION_SETTINGS_MODE;
  private _settingsEngine?: SettingsEngine;
  private _shadows: boolean = true;
  private _show: boolean = false;
  private _showStatistics: boolean = false;
  private _spinnerDivElement: HTMLDivElement;
  private _type: RENDERER_TYPE = RENDERER_TYPE.STANDARD;
  private _visualizeAttributes: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined;

  readonly #defaultLogo: string = 'https://viewer.shapediver.com/v3/graphics/logo_animated_breath.svg';
  readonly #defaultLogoStatic: string = 'https://viewer.shapediver.com/v3/graphics/logo.png';
  readonly #defaultSpinner: string = 'https://viewer.shapediver.com/v3/graphics/spinner_ripple.svg';

  #animations: {
    [key: string]: IAnimationData
  } = {};
  #flags: { [key: string]: string[] } = {
    [FLAG_TYPE.CAMERA_FREEZE]: [],
    [FLAG_TYPE.CONTINUOUS_RENDERING]: [],
    [FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE]: [],
  };

  // #endregion Properties (61)

  // #region Constructors (1)

  constructor(properties?: {
    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
      logo?: string | null,
      backgroundColor?: string,
      busyModeSpinner?: string,
      busyModeDisplay?: BUSY_MODE_DISPLAY,
      spinnerPositioning?: SPINNER_POSITIONING
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
  }) {
    // THREE object has default Y, we change that (although it doesn't work everywhere)
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

    const prop = Object.assign({}, properties);
    const branding = Object.assign({}, prop.branding);

    // setting some of the provided properties
    this._id = prop.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    this._visibility = prop.visibility || VISIBILITY_MODE.SESSION;
    this._sessionSettingsMode = prop.sessionSettingsMode || SESSION_SETTINGS_MODE.FIRST;
    this._sessionSettingsId = prop.sessionSettingsId;
    this._branding = {
      logo: branding.logo === undefined ? this.#defaultLogo : branding.logo,
      backgroundColor: branding.backgroundColor || '#393a45FF',
      busyModeSpinner: branding.busyModeSpinner === undefined ? this.#defaultSpinner : branding.busyModeSpinner,
      busyModeDisplay: branding.busyModeDisplay || BUSY_MODE_DISPLAY.SPINNER,
      spinnerPositioning: branding.spinnerPositioning || SPINNER_POSITIONING.BOTTOM_RIGHT
    };

    // creation of viewer essentials
    this._canvas = this._canvasEngine.getCanvas(this._canvasEngine.createCanvasObject(prop.canvas));

    this._canvas.canvasElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      // prevent three.js event
      event.stopImmediatePropagation();
      this.displayErrorMessage(`An error occurred, please reload the page. If this happens again, please let us know.`);
      this.show = false;
    }, false);

    this._canvas.canvasElement.addEventListener('webglcontextrestored', (event) => {
      event.preventDefault();
      // prevent three.js event
      event.stopImmediatePropagation();
    }, false);

    // creation of the engines (all singleton engines were created already)
    this._domEventEngine = new DomEventEngine(this._canvas.canvasElement);
    this._cameraEngine = new CameraEngine(this, this._canvas.canvasElement);
    this._lightEngine = new LightEngine(this);

    // creation of the managers (all singleton engines were created already)
    this._animationManager = new AnimationManager(this);
    this._beautyRenderingManager = new BeautyRenderingManager(this);
    this._cameraManager = new CameraManager(this);
    this._environmentGeometryManager = new EnvironmentGeometryManager(this);
    this._sceneTracingManager = new SceneTracingManager(this);
    this._sceneTreeManager = new SceneTreeManager(this);
    this._renderingManager = new RenderingManager(this);

    // loaders
    this._environmentMapLoader = new EnvironmentMapLoader(this);
    this._materialLoader = new MaterialLoader(this);
    this._geometryLoader = new GeometryLoader(this);
    this._htmlElementAnchorLoader = new HTMLElementAnchorLoader(this);
    this._lightLoader = new LightLoader(this);

    // start the creation and initialization process 
    this._renderer = this.renderingManager.createRenderer(this._canvas.canvasElement);
    this._logoDivElement = this.renderingManager.addLogo(this._canvas.canvasElement, this._branding);
    this._spinnerDivElement = this.renderingManager.addSpinner(this._canvas.canvasElement, this._branding);

    // creation of the managers (all singleton engines were created already)
    this._beautyRenderingManager.init();
    this._cameraManager.init();
    this._environmentGeometryManager.init();
    this._sceneTracingManager.init();
    this._sceneTreeManager.init();
    this._renderingManager.init();

    // loaders
    this._environmentMapLoader.init();
    this._materialLoader.init();
    this._geometryLoader.init();
    this._htmlElementAnchorLoader.init();
    this._lightLoader.init();

    this._renderingManager.start()

    this._stateEngine.renderingEngines[this.id].boundingBoxCreated.then(() => {
      this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox);
    })

    if (this._sessionSettingsMode === SESSION_SETTINGS_MODE.NONE) {
      this.environmentMap = 'photo_studio';
      this.ambientOcclusion = false;
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (103)

  public get ambientOcclusion(): boolean {
    return this._ambientOcclusion;
  }

  public set ambientOcclusion(value: boolean) {
    this._ambientOcclusion = value;
  }

  public get ambientOcclusionIntensity(): number {
    return this._ambientOcclusionIntensity;
  }

  public set ambientOcclusionIntensity(value: number) {
    this._ambientOcclusionIntensity = value;
  }

  public get animationManager(): AnimationManager {
    return this._animationManager;
  }

  public get animations(): {
    [key: string]: IAnimationData
  } {
    return this.#animations;
  }

  public get arRotation(): vec3 {
    return this._arRotation;
  }

  public set arRotation(value: vec3) {
    this._arRotation = value;
  }

  public get arScale(): vec3 {
    return this._arScale;
  }

  public set arScale(value: vec3) {
    this._arScale = value;
  }

  public get arTranslation(): vec3 {
    return this._arTranslation;
  }

  public set arTranslation(value: vec3) {
    this._arTranslation = value;
  }

  public get automaticResizing(): boolean {
    return this._automaticResizing;
  }

  public set automaticResizing(value: boolean) {
    this._automaticResizing = value;
  }

  public get beautyRenderBlendingDuration(): number {
    return this._beautyRenderBlendingDuration;
  }

  public set beautyRenderBlendingDuration(value: number) {
    this._beautyRenderBlendingDuration = value;
  }

  public get beautyRenderDelay(): number {
    return this._beautyRenderDelay;
  }

  public set beautyRenderDelay(value: number) {
    this._beautyRenderDelay = value;
  }

  public get beautyRenderingManager(): BeautyRenderingManager {
    return this._beautyRenderingManager;
  }

  public get busy(): boolean {
    return this._busy;
  }

  public set busy(value: boolean) {
    this._busy = value;
  }

  public get busyModeDisplay(): BUSY_MODE_DISPLAY {
    return this._busyModeDisplay;
  }

  public set busyModeDisplay(value: BUSY_MODE_DISPLAY) {
    this._busyModeDisplay = value;
  }

  public get branding(): {
    logo: string | null;
    backgroundColor: string;
    busyModeSpinner: string;
    busyModeDisplay: BUSY_MODE_DISPLAY;
    spinnerPositioning: SPINNER_POSITIONING
  } {
    return this._branding;
  }

  public get cameraEngine(): CameraEngine {
    return this._cameraEngine;
  }

  public get cameraManager(): CameraManager {
    return this._cameraManager;
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas.canvasElement;
  }

  public get canvasEngine(): CanvasEngine {
    return this._canvasEngine;
  }

  public get clearAlpha(): number {
    return this._clearAlpha;
  }

  public set clearAlpha(value: number) {
    this._clearAlpha = value;
  }

  public get clearColor(): string {
    return this._clearColor;
  }

  public set clearColor(value: string) {
    this._clearColor = value;
  }

  public get closed(): boolean {
    return this._closed;
  }

  public get continuousRendering(): boolean {
    return this._renderingManager.continuousRendering;
  }

  public set continuousRendering(value: boolean) {
    this._renderingManager.continuousRendering = value;
  }

  public get continuousShadowMapUpdate(): boolean {
    return this._renderingManager.continuousShadowMapUpdate;
  }

  public set continuousShadowMapUpdate(value: boolean) {
    this._renderingManager.continuousShadowMapUpdate = value;
  }

  public get domEventEngine(): DomEventEngine {
    return this._domEventEngine;
  }

  public get enableAR(): boolean {
    return this._enableAR;
  }

  public set enableAR(value: boolean) {
    this._enableAR = value;
  }

  public get environmentMap(): string | string[] {
    return this._environmentMap;
  }

  public set environmentMap(value: string | string[]) {
    this._environmentMap = value;
    this._environmentMapLoader.load(this.environmentMap);
  }

  public get environmentMapAsBackground(): boolean {
    return this._environmentMapAsBackground;
  }

  public set environmentMapAsBackground(value: boolean) {
    this._environmentMapAsBackground = value;
  }

  public get environmentMapLoader(): EnvironmentMapLoader {
    return this._environmentMapLoader;
  }

  public get environmentMapResolution(): string {
    return this._environmentMapResolution;
  }

  public set environmentMapResolution(value: string) {
    this._environmentMapResolution = value;
    this._environmentMapLoader.load(this.environmentMap);
  }

  public get eventEngine(): EventEngine {
    return this._eventEngine;
  }

  public get geometryLoader(): GeometryLoader {
    return this._geometryLoader;
  }

  public get gridColor(): string {
    return this._environmentGeometryManager.gridColor;
  }

  public set gridColor(value: string) {
    this._environmentGeometryManager.gridColor = value;
  }

  public get gridVisibility(): boolean {
    return this._gridVisibility;
  }

  public set gridVisibility(value: boolean) {
    if (this._environmentGeometryManager.grid) this._environmentGeometryManager.grid.visible = value;
    this._gridVisibility = value;
  }

  public get groundPlaneColor(): string {
    return this._environmentGeometryManager.groundPlaneColor;
  }

  public set groundPlaneColor(value: string) {
    this._environmentGeometryManager.groundPlaneColor = value;
  }

  public get groundPlaneVisibility(): boolean {
    return this._groundPlaneVisibility;
  }

  public set groundPlaneVisibility(value: boolean) {
    if (this._environmentGeometryManager.groundPlane) this._environmentGeometryManager.groundPlane.visible = value;
    this._groundPlaneVisibility = value;
  }

  public get groundPlaneShadowColor(): string {
    return this._environmentGeometryManager.groundPlaneShadowColor;
  }

  public set groundPlaneShadowColor(value: string) {
    this._environmentGeometryManager.groundPlaneShadowColor = value;
  }

  public get groundPlaneShadowVisibility(): boolean {
    return this._groundPlaneShadowVisibility;
  }

  public set groundPlaneShadowVisibility(value: boolean) {
    if (this._environmentGeometryManager.groundPlaneShadow) this._environmentGeometryManager.groundPlaneShadow.visible = value;
    this._groundPlaneShadowVisibility = value;
  }

  public get htmlElementAnchorLoader(): HTMLElementAnchorLoader {
    return this._htmlElementAnchorLoader;
  }

  public get id(): string {
    return this._id;
  }

  public get lightEngine(): LightEngine {
    return this._lightEngine;
  }

  public get lightLoader(): LightLoader {
    return this._lightLoader;
  }

  public get lights(): boolean {
    return this._lights;
  }

  public set lights(value: boolean) {
    this._lights = value;
  }

  public get lightScene(): string {
    return this.lightEngine.lightScene ? this.lightEngine.lightScene.id : '';
  }

  public get lightSceneId(): string {
    return this.lightEngine.lightScene ? this.lightEngine.lightScene.id : '';
  }

  public get logoDivElement(): HTMLDivElement {
    return this._logoDivElement;
  }

  public get materialLoader(): MaterialLoader {
    return this._materialLoader;
  }

  public get minimalRendering(): boolean {
    return this.renderingManager.minimalRendering;
  }

  public get outputEncoding(): TEXTURE_ENCODING {
    switch (this._renderer.outputEncoding) {
      case (THREE.sRGBEncoding):
        return TEXTURE_ENCODING.SRGB;
      case (THREE.LinearEncoding):
      default:
        return TEXTURE_ENCODING.LINEAR;
    }
  }

  public set outputEncoding(value: TEXTURE_ENCODING) {
    switch (value) {
      case (TEXTURE_ENCODING.SRGB):
        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._beautyRenderingManager.assignOutputEncoding(THREE.sRGBEncoding);
        break;
      case (TEXTURE_ENCODING.LINEAR):
      default:
        this._renderer.outputEncoding = THREE.LinearEncoding;
        this._beautyRenderingManager.assignOutputEncoding(THREE.LinearEncoding);
        break;
    }
  }

  public get physicallyCorrectLights(): boolean {
    return this._renderer.physicallyCorrectLights;
  }

  public set physicallyCorrectLights(value: boolean) {
    this._renderer.physicallyCorrectLights = value;
  }

  public get pointSize(): number {
    return this._pointSize;
  }

  public set pointSize(value: number) {
    this._pointSize = value;
    this.materialLoader.assignPointSize(value)
  }

  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  public get renderingManager(): RenderingManager {
    return this._renderingManager;
  }

  public get scene(): THREE.Scene {
    return this._sceneTreeManager.scene;
  }

  public get sceneTracingManager(): SceneTracingManager {
    return this._sceneTracingManager;
  }

  public get sceneTreeManager(): SceneTreeManager {
    return this._sceneTreeManager;
  }

  public get sessionSettingsId(): string | undefined {
    return this._sessionSettingsId;
  }

  public set sessionSettingsId(value: string | undefined) {
    this._sessionSettingsId = value;
  }

  public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
    return this._sessionSettingsMode;
  }

  public set sessionSettingsMode(value: SESSION_SETTINGS_MODE) {
    this._sessionSettingsMode = value;
  }

  public get settingsEngine(): SettingsEngine | undefined {
    return this._settingsEngine;
  }

  public set settingsEngine(value: SettingsEngine | undefined) {
    this._settingsEngine = value;
  }

  public get shadows(): boolean {
    return this._shadows;
  }

  public set shadows(value: boolean) {
    this._shadows = value;
  }

  public get show(): boolean {
    return this._show;
  }

  public set show(value: boolean) {
    this._show = value;
  }

  public get showStatistics(): boolean {
    return this._showStatistics;
  }

  public set showStatistics(value: boolean) {
    this._showStatistics = value;
  }

  public get spinnerDivElement(): HTMLDivElement {
    return this._spinnerDivElement;
  }

  public get stateEngine(): StateEngine {
    return this._stateEngine;
  }

  public get textureEncoding(): TEXTURE_ENCODING {
    switch (this.materialLoader.textureEncoding) {
      case (THREE.sRGBEncoding):
        return TEXTURE_ENCODING.SRGB;
      case (THREE.LinearEncoding):
      default:
        return TEXTURE_ENCODING.LINEAR;
    }
  }

  public set textureEncoding(value: TEXTURE_ENCODING) {
    switch (value) {
      case (TEXTURE_ENCODING.SRGB):
        this.environmentMapLoader.textureEncoding = THREE.sRGBEncoding;
        this.materialLoader.textureEncoding = THREE.sRGBEncoding;
        break;
      case (TEXTURE_ENCODING.LINEAR):
      default:
        this.environmentMapLoader.textureEncoding = THREE.LinearEncoding;
        this.materialLoader.textureEncoding = THREE.LinearEncoding;
    }
  }

  public get toneMapping(): TONE_MAPPING {
    switch (this._renderer.toneMapping) {
      case (THREE.LinearToneMapping):
        return TONE_MAPPING.LINEAR;
      case (THREE.ReinhardToneMapping):
        return TONE_MAPPING.REINHARD;
      case (THREE.CineonToneMapping):
        return TONE_MAPPING.CINEON;
      case (THREE.ACESFilmicToneMapping):
        return TONE_MAPPING.ACES_FILMIC;
      case (THREE.NoToneMapping):
      default:
        return TONE_MAPPING.NONE;
    }
  }

  public set toneMapping(value: TONE_MAPPING) {
    switch (value) {
      case (TONE_MAPPING.LINEAR):
        this._renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case (TONE_MAPPING.REINHARD):
        this._renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case (TONE_MAPPING.CINEON):
        this._renderer.toneMapping = THREE.CineonToneMapping;
        break;
      case (TONE_MAPPING.ACES_FILMIC):
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
      case (TONE_MAPPING.NONE):
      default:
        this._renderer.toneMapping = THREE.NoToneMapping;
    }
    this.materialLoader.updateMaterials();
  }

  public get toneMappingExposure(): number {
    return this._renderer.toneMappingExposure;
  }

  public set toneMappingExposure(value: number) {
    this._renderer.toneMappingExposure = value;
  }

  public get type(): RENDERER_TYPE {
    return this._type;
  }

  public set type(value: RENDERER_TYPE) {
    this._type = value;
    this.update('RenderingEngine.type')
  }

  public get usingSwiftShader(): boolean {
    return this.renderingManager.usingSwiftShader;
  }

  public get visibility(): VISIBILITY_MODE {
    return this._visibility;
  }

  public get visualizeAttributes(): ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined {
    return this._visualizeAttributes;
  }

  public set visualizeAttributes(value: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined) {
    this._visualizeAttributes = value;
  }

  // #endregion Public Accessors (103)

  // #region Public Methods (16)

  public addFlag(flag: FLAG_TYPE): string {
    const token = this._uuidGenerator.create();
    if (flag === FLAG_TYPE.BUSY_MODE) {
      this.stateEngine.renderingEngines[this.id].busy.push(token);
    } else {
      this.#flags[flag].push(token);
    }
    this.evaluateFlagState();
    return token;
  }

  public applySettings(
    sections: {
      ar?: boolean,
      scene?: boolean,
      camera?: boolean,
      light?: boolean,
      environment?: boolean,
      general?: boolean
    } = {
      ar: true,
      scene: true,
      camera: true,
      light: true,
      environment: true,
      general: true
    },
    settingsEngine?: SettingsEngine
  ) {

    settingsEngine = settingsEngine || this._settingsEngine
    if (!settingsEngine) return;

    if (sections.environment) {
      // as the environment map is the only thing that needs time to load, load it first
      this._stateEngine.renderingEngines[this.id].environmentMapLoaded.then(() => {
        if (!settingsEngine) return;
        this.environmentMapAsBackground = settingsEngine.environment.mapAsBackground;
        this.clearAlpha = settingsEngine.environment.clearAlpha;
        this.clearColor = this._converter.toColor(settingsEngine.environment.clearColor);
        this.applySyncSettings(sections)
      })

      // set it like this to not trigger the loading
      this.environmentMap = settingsEngine.environment.map;
    } else {
      this.applySyncSettings(sections)
    }
  }

  public convert3Dto2D(p: vec3): { container: vec2; client: vec2; page: vec2; hidden: boolean; } {
    return this.sceneTracingManager.convert3Dto2D(p)
  }

  public async close(): Promise<void> {
    this._closed = true;
    this._lightEngine.close();
    this._renderer.clear(true, true, true);
    this._renderer.dispose();
    this._domEventEngine.removeAllDomEventListener();
    this._domEventEngine.dispose();
    this._canvas.canvasElement.parentElement?.removeChild(this._logoDivElement);
    this._canvas.canvasElement.parentElement?.removeChild(this._spinnerDivElement);
    this._canvas.canvasElement.parentNode?.removeChild(this._htmlElementAnchorLoader.parentDiv);
    this._canvas.reset();
  }

  public createSDTFOverview(node: ITreeNode): ISDTFOverview {
    const out: ISDTFOverviewData = new SDTFOverviewData({});
    for (let i = 0, len = node.data.length; i < len; i++)
      if (node.data[i] instanceof SDTFOverviewData)
        out.merge(<ISDTFOverviewData>node.data[i])

    for (let i = 0, len = node.children.length; i < len; i++)
      out.merge(new SDTFOverviewData(this.createSDTFOverview(node.children[i])));

    return out.overview;
  }

  public displayErrorMessage(message: string) {
    for (let i = 0; i < this.logoDivElement.children.length; i++)
      (<HTMLElement>this.logoDivElement.children[i]).style.visibility = 'hidden';

    const d = <HTMLDivElement>document.createElement('div');
    d.style.position = 'absolute';
    d.style.top = '50%';
    d.style.left = '50%';
    d.style.transform = 'translateX(-50%) translateY(-50%)';
    d.style.textAlign = 'center';
    this.logoDivElement.appendChild(d);

    const p = <HTMLParagraphElement>document.createElement('p');
    p.textContent = message;
    p.style.fontFamily = '"CircularXXWeb-Book",sans-serif';
    p.style.fontSize = 'x-large';
    p.style.color = this.logoDivElement.style.backgroundColor;
    p.style['filter'] = 'invert(100%)';
    d.appendChild(p);
  }

  public evaluateFlagState() {
    // busy
    {
      const currentBusyState = this.busy;
      if (this.stateEngine.renderingEngines[this.id] && this.stateEngine.renderingEngines[this.id].busy.length > 0) {
        if (!currentBusyState) {
          this.busy = true;
          this._renderingManager.render();
          this._eventEngine.emitEvent(EVENTTYPE.VIEWPORT.BUSY_MODE_ON, { viewportId: this.id });
        }
      } else {
        if (currentBusyState) {
          this.busy = false;
          this._renderingManager.render();
          this._eventEngine.emitEvent(EVENTTYPE.VIEWPORT.BUSY_MODE_OFF, { viewportId: this.id });
        }
      }
    }

    // camera freeze
    {
      if (this.#flags[FLAG_TYPE.CAMERA_FREEZE].length > 0) {
        this.cameraEngine.deactivateCameraEvents();
      } else {
        this.cameraEngine.activateCameraEvents();
      }
    }

    // continuous rendering
    {
      const currentContinuousRenderingState = this.continuousRendering;
      if (this.#flags[FLAG_TYPE.CONTINUOUS_RENDERING].length > 0) {
        if (!currentContinuousRenderingState) {
          this.continuousRendering = true;
          this._renderingManager.render();
        }
      } else {
        if (currentContinuousRenderingState) {
          this.continuousRendering = false;
        }
      }
    }

    // continuous shadow map update
    {
      const currentShadowMapUpdateState = this.continuousShadowMapUpdate;
      if (this.#flags[FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE].length > 0) {
        if (!currentShadowMapUpdateState) {
          this.continuousShadowMapUpdate = true;
          this._renderingManager.render();
        }
      } else {
        if (currentShadowMapUpdateState) {
          this.continuousShadowMapUpdate = false;
        }
      }
    }
  }

  public gatherAnimations(node: ITreeNode = this._tree.root): AnimationData[] {
    let out: AnimationData[] = [];
    for (let i = 0, len = node.data.length; i < len; i++)
      if (node.data[i] instanceof AnimationData)
        out.push(<AnimationData>node.data[i])

    for (let i = 0, len = node.children.length; i < len; i++)
      out = out.concat(this.gatherAnimations(node.children[i]))

    return out;
  }

  public getEnvironmentMapImageUrl() {
    return this._environmentMapLoader.getEnvironmentMapImageUrl(this.environmentMap);
  }

  public getScreenshot(type?: string, encoderOptions?: number): string {
    return this._renderingManager.getScreenshot(type, encoderOptions);
  }

  public mouseEventToRay(event: MouseEvent): { origin: vec3, direction: vec3 } {
    return this._sceneTracingManager.mouseEventToRay(event);
  }

  public raytraceScene(origin: vec3, direction: vec3, root?: ITreeNode): { distance: number, node: ITreeNode, data: IGeometryData; }[] {
    return this.sceneTracingManager.trace(origin, direction, root)
  }

  public removeFlag(token: string): boolean {
    let success = false;
    const Flags = Object.values(FLAG_TYPE);
    for (let f of Flags) {
      if (f === FLAG_TYPE.BUSY_MODE) {
        if (this.stateEngine.renderingEngines[this.id].busy.includes(token)) {
          this.stateEngine.renderingEngines[this.id].busy.splice(this.stateEngine.renderingEngines[this.id].busy.indexOf(token), 1);
          success = true;
          break;
        }
      } else {
        if (this.#flags[f].includes(token)) {
          this.#flags[f].splice(this.#flags[f].indexOf(token), 1);
          success = true;
          break;
        }
      }
    }
    this.evaluateFlagState();
    return success;
  }

  public reset() {
    this._stateEngine.renderingEngines[this.id].settingsAssigned.reset();
    this._stateEngine.renderingEngines[this.id].boundingBoxCreated.reset();
    this._stateEngine.renderingEngines[this.id].environmentMapLoaded.reset();

    this._stateEngine.renderingEngines[this.id].boundingBoxCreated.then(() => {
      this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox);
    })
  }

  public resize(width: number, height: number): void {
    this._renderingManager.resize(width, height);
    this._renderingManager.render();
  }

  public saveSettings(settingsEngine?: SettingsEngine) {
    settingsEngine = settingsEngine || this._settingsEngine
    if (!settingsEngine) return;

    (<LightEngine>this.lightEngine).saveSettings(settingsEngine);
    (<CameraEngine>this.cameraEngine).saveSettings(settingsEngine);

    settingsEngine.ar.enable = this.enableAR;

    settingsEngine.environment.mapResolution = this.environmentMapResolution;
    settingsEngine.environment.map = Array.isArray(this.environmentMap) ? JSON.stringify(this.environmentMap) : this.environmentMap;
    settingsEngine.environment.mapAsBackground = this.environmentMapAsBackground;
    settingsEngine.environment.clearAlpha = this.clearAlpha;
    settingsEngine.environment.clearColor = this.clearColor;

    settingsEngine.environmentGeometry.gridVisibility = this.gridVisibility;
    settingsEngine.environmentGeometry.groundPlaneVisibility = this.groundPlaneVisibility;
    //settingsEngine.environmentGeometry.groundPlaneShadowVisibility = this.groundPlaneShadowVisibility;
    settingsEngine.environmentGeometry.gridColor = this.gridColor;
    settingsEngine.environmentGeometry.groundPlaneColor = this.groundPlaneColor;
    //settingsEngine.environmentGeometry.groundPlaneShadowColor = this.groundPlaneShadowColor;

    settingsEngine.general.pointSize = this.pointSize;
    settingsEngine.general.transformation.rotation = { x: this.arRotation[0], y: this.arRotation[1], z: this.arRotation[2] };
    settingsEngine.general.transformation.translation = { x: this.arTranslation[0], y: this.arTranslation[1], z: this.arTranslation[2] };
    settingsEngine.general.transformation.scale = { x: this.arScale[0], y: this.arScale[1], z: this.arScale[2] };

    settingsEngine.rendering.ambientOcclusion = this.ambientOcclusion;
    settingsEngine.rendering.ambientOcclusionIntensity = this.ambientOcclusionIntensity;
    settingsEngine.rendering.outputEncoding = this.outputEncoding;
    settingsEngine.rendering.physicallyCorrectLights = this.physicallyCorrectLights;
    settingsEngine.rendering.textureEncoding = this.textureEncoding;
    settingsEngine.rendering.toneMapping = this.toneMapping;
    settingsEngine.rendering.toneMappingExposure = this.toneMappingExposure;
    settingsEngine.rendering.beautyRenderBlendingDuration = this.beautyRenderBlendingDuration;
    settingsEngine.rendering.beautyRenderDelay = this.beautyRenderDelay;
    settingsEngine.rendering.shadows = this.shadows;
    
  }

  public startGatherAnimations(node: ITreeNode = this._tree.root) {
    this.#animations = {};

    const animationArray = this.gatherAnimations();
    const names = animationArray.map(a => a.name);
    const animationDictionary: {
      [key: string]: number
    } = {};

    for(let i = 0; i < animationArray.length; i++) {
      const animationName = animationArray[i].name;
      
      const nameIndices = [];
      for(let j = 0; j < names.length; j++)
        if(animationName === names[j])
          nameIndices.push(j);

      let animationNameAdjusted = animationName;
      // name adjustement if the name occurs multiple times
      if(nameIndices.length > 1) {
        animationNameAdjusted = animationName + '_' + nameIndices.indexOf(i);
        // even further name adjustement if the name is even then the same after adjustements (probably will never happen)
        while(names.includes(animationNameAdjusted))
          animationNameAdjusted += "_0";
      }
      
      this.#animations[animationNameAdjusted] = animationArray[i];
    }
  }
  
  public touchToRay(event: Touch): { origin: vec3, direction: vec3 } {
    return this._sceneTracingManager.touchToRay(event);
  }

  public touchEventToRay(event: TouchEvent): { origin: vec3, direction: vec3 } {
    return this._sceneTracingManager.touchEventToRay(event);
  }

  public update(id: string): void {
    if(this.closed) return;
    this._sceneTreeManager.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    this._renderingManager.updateShadowMap();
    this.startGatherAnimations();
    this._renderingManager.render();

    this._renderingManager.lastRootVersion = this._tree.root.version;
  }

  public updateEnvironmentGeometry(): void {
    this._environmentGeometryManager.updateEnvironmentGeometryPosition();
  }

  public async viewInAR(file: string, options: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean } = { arScale: 'auto', arPlacement: 'floor', xrEnvironment: false }): Promise<void> {
    const eventId = this._uuidGenerator.create();
    const event: ITaskEvent = { type: TASK_TYPE.AR_LOADING, id: eventId, progress: 0, status: 'Loading AR scene' };
    this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

    // if this is not a supported device, throw an error
    if (this.viewableInAR() === false) {
      const event: ITaskEvent = { type: TASK_TYPE.AR_LOADING, id: eventId, progress: 1, status: 'Stopped AR loading due to an error' };
      this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
      const error = new ShapeDiverViewerArError('Api.viewInAR: The device or browser is not supported for this functionality, please call "viewableInAR" for more information.');
      throw this._logger.handleError(LOGGING_TOPIC.AR, 'Api.viewInAR', error, false);
    }

    const arScale = options.arScale !== 'auto' ? 'fixed' : 'auto';
    const arPlacement = options.arPlacement !== 'wall' ? 'floor' : 'wall';
    const xrEnvironment = options.xrEnvironment !== true ? false : true;

    let arEnvironment = '';
    const envMapUrl = this.getEnvironmentMapImageUrl();
    if (envMapUrl !== '') {
      if (envMapUrl.endsWith('.hdr')) {
        arEnvironment = 'skybox-image=' + envMapUrl;
      } else {
        arEnvironment = 'environment-image=' + envMapUrl;
      }
    }

    if (this._systemInfo.isIOS) {
      // create the link and click it
      const a = document.createElement('a');
      a.href = file + (arScale === 'fixed' ? '.usdz_allowsContentScaling=0' : '.usdz')
      a.rel = 'ar';
      const img = document.createElement('img');
      img.src = this.#defaultLogoStatic;
      a.appendChild(img);
      a.click();
    } else {
      const a = document.createElement('a');
      a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${arScale === 'fixed' ? 'false' : 'true'}&file=${file}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`
      a.click();
    }

    const event2: ITaskEvent = { type: TASK_TYPE.AR_LOADING, id: eventId, progress: 1, status: 'Done loading AR scene, launching AR' };
    this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event2);
  }

  public viewableInAR(): boolean {
    // has to be a mobile device (duh)
    if (this._systemInfo.isIOS === false && this._systemInfo.isAndroid === false)
      return false;

    // no Firefox on Android
    if (this._systemInfo.isAndroid === true && this._systemInfo.isFirefox === true)
      return false;

    // no Firefox on iOS
    if (this._systemInfo.isIOS === true && this._systemInfo.isFirefox === true)
      return false;

    return true;
  }

  // #endregion Public Methods (16)

  // #region Private Methods (1)

  private applySyncSettings(sections: {
    ar?: boolean,
    scene?: boolean,
    camera?: boolean,
    light?: boolean,
    environment?: boolean,
    general?: boolean
  } = {
      ar: true,
      scene: true,
      camera: true,
      light: true,
      environment: true,
      general: true
    }) {
    if (!this._settingsEngine) return;
    
    if (sections.ar) {
      this.enableAR = this._settingsEngine.ar.enable;
      this.arScale = [this._settingsEngine.general.transformation.scale.x, this._settingsEngine.general.transformation.scale.y, this._settingsEngine.general.transformation.scale.z];
      this.arTranslation = [this._settingsEngine.general.transformation.translation.x, this._settingsEngine.general.transformation.translation.y, this._settingsEngine.general.transformation.translation.z];
      this.arRotation = [this._settingsEngine.general.transformation.rotation.x, this._settingsEngine.general.transformation.rotation.y, this._settingsEngine.general.transformation.rotation.z];
    }

    if (sections.scene) {
      this.gridColor = this._settingsEngine.environmentGeometry.gridColor;
      this.gridVisibility = this._settingsEngine.environmentGeometry.gridVisibility;
      this.groundPlaneColor = this._settingsEngine.environmentGeometry.groundPlaneColor;
      this.groundPlaneVisibility = this._settingsEngine.environmentGeometry.groundPlaneVisibility;
      // this.groundPlaneShadowColor = this._settingsEngine.environmentGeometry.groundPlaneShadowColor;
      // this.groundPlaneShadowVisibility = this._settingsEngine.environmentGeometry.groundPlaneShadowVisibility;

      this.shadows = this._settingsEngine.rendering.shadows;
      this.ambientOcclusion = this._settingsEngine.rendering.ambientOcclusion;

      this.textureEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.textureEncoding;
      this.outputEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.outputEncoding;
      this.physicallyCorrectLights = this._settingsEngine.rendering.physicallyCorrectLights;
      this.toneMapping = <TONE_MAPPING>this._settingsEngine.rendering.toneMapping;
      this.toneMappingExposure = this._settingsEngine.rendering.toneMappingExposure;
    }

    if (sections.general) {
      this.pointSize = this._settingsEngine.general.pointSize;
    }

    if (sections.light) (<LightEngine>this.lightEngine).applySettings(this._settingsEngine);
    if (sections.camera) (<CameraEngine>this.cameraEngine).applySettings(this._settingsEngine);
    this._stateEngine.renderingEngines[this.id].settingsAssigned.resolve(true);
    this.update('RenderingEngine.applySyncSettings');
  }

  // #endregion Private Methods (1)
}