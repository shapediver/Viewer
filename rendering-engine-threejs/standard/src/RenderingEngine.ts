import * as THREE from 'three'
import { vec2, vec3, vec4 } from 'gl-matrix'
import { container } from 'tsyringe'
import {
  AbstractCamera,
  CameraEngine,
  CAMERATYPE,
  ICameraEngine,
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  OrthographicCamera,
  OrthographicCameraControls,
  PerspectiveCamera,
  PerspectiveCameraControls,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { Canvas, CanvasEngine, ICanvas } from '@shapediver/viewer.rendering-engine.canvas-engine'
import { Tree } from '@shapediver/viewer.shared.node-tree'
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import {
  IRenderingEngine,
  RENDERERTYPE,
  TEXTURE_ENCODING,
  TONE_MAPPING,
  VISIBILITYMODE,
} from '@shapediver/viewer.rendering-engine.rendering-engine'
import {
  Converter,
  DomEventEngine,
  EventEngine,
  EVENTTYPE,
  IEvent,
  Logger,
  LOGGINGTOPIC,
  SettingsEngine,
  StateEngine,
} from '@shapediver/viewer.shared.services'
import {
  AnimationData,
  IEnvironmentEvent,
  ISceneEvent,
  ISettingsEvent,
  MATERIAL_SIDE,
  MaterialStandardData,
  SDTFAttributeOverview,
  SDTFAttributeVisualizationData,
  SDTFItemData,
  SDTFOverview,
} from '@shapediver/viewer.shared.types'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'

import { SceneTreeManager } from './managers/SceneTreeManager'
import { SDNode } from './types/SDNode'
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
  // #region Properties (53)

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
  // loaders
  private readonly _environmentMapLoader: EnvironmentMapLoader;
  private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  private readonly _geometryLoader: GeometryLoader;
  private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
  // constructor properties
  private readonly _branding: { logo: string | null, backgroundColor: string };
  private readonly _id: string;
  private readonly _lightEngine: LightEngine;
  private readonly _lightLoader: LightLoader;
  private readonly _logger: Logger = <Logger>container.resolve(Logger);
  private readonly _materialLoader: MaterialLoader;
  private readonly _renderer: THREE.WebGLRenderer;
  private readonly _renderingManager: RenderingManager;
  private readonly _sceneTracingManager: SceneTracingManager;
  private readonly _sceneTreeManager: SceneTreeManager;
  private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  private readonly _tree: Tree = <Tree>container.resolve(Tree);
  private readonly _visibility: VISIBILITYMODE;

  // settings
  private _ambientOcclusion: boolean = true;
  private _ambientOcclusionIntensity: number = 0.1;
  private _automaticResizing: boolean = true;
  private _beautyRenderBlendingDuration: number = 1500;
  private _beautyRenderDelay: number = 50;
  private _blur: boolean = false;
  private _blurSceneWhenBusy: boolean = true;
  private _busy: boolean = false;
  private _clearAlpha: number = 1.0;
  private _clearColor: string = '#ffffff';
  // viewer global vars
  private _closed: boolean = false;
  private _convertSDTFItemToVisualizationData: ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined;
  private _environmentMap: string | string[] = 'none';
  private _environmentMapAsBackground: boolean = false;
  private _environmentMapResolution: string = '1024';
  private _gridVisibility: boolean = true;
  private _groundPlaneVisibility: boolean = true;
  private _logoDivElement: HTMLDivElement;
  private _pointSize: number = 1.0;
  private _shadows: boolean = true;
  private _show: boolean = false;
  private _showStatistics: boolean = false;
  private _type: RENDERERTYPE = RENDERERTYPE.STANDARD;

  #animations: AnimationData[] = [];

  // #endregion Properties (53)

  // #region Constructors (1)

  constructor(properties: { id: string, canvas?: string | HTMLCanvasElement, visibility: VISIBILITYMODE, branding: { logo: string | null, backgroundColor: string } }) {
    // THREE object has default Y, we change that (although it doesn't work everywhere)
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

    // setting some of the provided properties
    this._id = properties.id;
    this._visibility = properties.visibility;
    this._branding = properties.branding;

    // creation of viewer essentials
    this._canvas = this._canvasEngine.getCanvas(this._canvasEngine.createCanvasObject(properties.canvas));

    // creation of the engines (all singleton engines were created already)
    this._domEventEngine = new DomEventEngine(this._id, this._canvas.canvasElement);
    this._cameraEngine = new CameraEngine(this._id, this._canvas.canvasElement, this._domEventEngine);
    this._lightEngine = new LightEngine(this._id);

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

    if (this._visibility === VISIBILITYMODE.INSTANT) this.show = true;

    if (this._visibility === VISIBILITYMODE.SESSION) {
      this._stateEngine.boundingBoxCreated.then(() => {
        if (this._closed) return;
        // wait for settings to load before showing the scene
        this._stateEngine.viewers[this.id].settingsLoaded.then(() => {
          if (this._closed) return;
          this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox);
          this.show = true;
        })
      })
    }

    this.stateEngine.primarySessionAvailable.then(() => {
      this.stateEngine.primarySession?.settingsRegistered.then(() => {
        if (this._closed) return;
        this.applySettings()
      })
    })
  }

  // #endregion Constructors (1)

  // #region Public Accessors (78)

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

  public get animations(): AnimationData[] {
    return this.#animations;
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

  public get blur(): boolean {
    return this._blur;
  }

  public set blur(value: boolean) {
    this._blur = value;
  }

  public get blurSceneWhenBusy(): boolean {
    return this._blurSceneWhenBusy;
  }

  public set blurSceneWhenBusy(value: boolean) {
    this._blurSceneWhenBusy = value;
  }

  public get busy(): boolean {
    return this._busy;
  }

  public set busy(value: boolean) {
    this._busy = value;
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

  public get convertSDTFItemToVisualizationData(): ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined {
    return this._convertSDTFItemToVisualizationData;
  }

  public set convertSDTFItemToVisualizationData(value: ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined) {
    this._convertSDTFItemToVisualizationData = value;
  }

  public get domEventEngine(): DomEventEngine {
    return this._domEventEngine;
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

  public get settingsEngine(): SettingsEngine {
    return this._settingsEngine;
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

  public get type(): RENDERERTYPE {
    return this._type;
  }

  public set type(value: RENDERERTYPE) {
    this._type = value;
  }

  public get usingSwiftShader(): boolean {
    return this.renderingManager.usingSwiftShader;
  }

  // #endregion Public Accessors (78)

  // #region Public Methods (8)

  public async close(): Promise<boolean> {
    this._closed = true;
    this._lightEngine.close();
    this._renderer.clear(true, true, true);
    this._renderer.dispose();
    this._canvas.canvasElement.parentElement?.removeChild(this._logoDivElement);
    this._canvas.canvasElement.parentNode?.removeChild(this._htmlElementAnchorLoader.parentDiv);
    this._canvas.reset();
    this._domEventEngine.removeAllDomEventListener();
    this._domEventEngine.dispose();
    return true;
  }

  public displayErrorMessage(message: string) {
    for(let i = 0; i < this.logoDivElement.children.length; i++)
      (<HTMLElement>this.logoDivElement.children[i]).style.visibility = 'hidden';
    
    const d = <HTMLDivElement>document.createElement('div');
    d.style.position = 'absolute';
    d.style.top = '50%';
    d.style.left = '50%';
    d.style.transform = 'translateX(-50%) translateY(-50%)';
    d.style.textAlign='center';
    this.logoDivElement.appendChild(d);

    const p = <HTMLParagraphElement>document.createElement('p');
    p.textContent = message;
    p.style.fontFamily = '"CircularXXWeb-Book",sans-serif';
    p.style.fontSize = 'x-large';
    p.style.color = this.logoDivElement.style.backgroundColor;
    p.style['filter'] = 'invert(100%)';
    d.appendChild(p);
  }

  public gatherAnimations(node: TreeNode = this._tree.root): AnimationData[] {
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

  public reset() {
    this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox)
    if (this._visibility === VISIBILITYMODE.SESSION) this.show = false;
    this._stateEngine.viewers[this.id].settingsLoaded.reset();
  }

  public resize(width: number, height: number): void {
    this._renderingManager.resize(width, height);
    this._renderingManager.render();
  }

  public saveSettings() {
    (<LightEngine>this.lightEngine).saveSettings();
    (<CameraEngine>this.cameraEngine).saveSettings();

    this._settingsEngine.general.blurWhenBusy = this.blurSceneWhenBusy;
    this._settingsEngine.environmentGeometry.gridVisibility = this.gridVisibility;
    this._settingsEngine.environmentGeometry.groundPlaneVisibility = this.groundPlaneVisibility;
    this._settingsEngine.environment.mapResolution = this.environmentMapResolution;
    this._settingsEngine.environment.map = Array.isArray(this.environmentMap) ? JSON.stringify(this.environmentMap) : this.environmentMap;
    this._settingsEngine.environment.mapAsBackground = this.environmentMapAsBackground;
    this._settingsEngine.rendering.ambientOcclusion = this.ambientOcclusion;
    this._settingsEngine.rendering.ambientOcclusionIntensity = this.ambientOcclusionIntensity;
    this._settingsEngine.environmentGeometry.gridColor = this.gridColor;
    this._settingsEngine.environmentGeometry.groundPlaneColor = this.groundPlaneColor;
    this._settingsEngine.rendering.outputEncoding = this.outputEncoding;
    this._settingsEngine.rendering.physicallyCorrectLights = this.physicallyCorrectLights;
    this._settingsEngine.rendering.textureEncoding = this.textureEncoding;
    this._settingsEngine.rendering.toneMapping = this.toneMapping;
    this._settingsEngine.rendering.toneMappingExposure = this.toneMappingExposure;
    this._settingsEngine.rendering.beautyRenderBlendingDuration = this.beautyRenderBlendingDuration;
    this._settingsEngine.rendering.beautyRenderDelay = this.beautyRenderDelay;
    this._settingsEngine.environment.clearAlpha = this.clearAlpha;
    this._settingsEngine.environment.clearColor = this.clearColor;
    this._settingsEngine.general.pointSize = this.pointSize;
    this._settingsEngine.rendering.shadows = this.shadows;
  }

  public update(): void {
    this._sceneTreeManager.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    this._renderingManager.updateShadowMap();
    this.#animations = this.gatherAnimations();
    this._renderingManager.render();
  }

  // #endregion Public Methods (8)

  // #region Private Methods (1)

  public applySettings(sections: { camera?: boolean, light?: boolean, scene?: boolean, environment?: boolean } = { camera: true, light: true, scene: true, environment: true }) {
    if (sections.environment) {
      // as the environment map is the only thing that needs time to load, load it first
      this._stateEngine.viewers[this.id].environmentMapLoaded.then(() => {
        this.environmentMapAsBackground = this._settingsEngine.environment.mapAsBackground;
        this.beautyRenderBlendingDuration = this._settingsEngine.rendering.beautyRenderBlendingDuration;
        this.beautyRenderDelay = this._settingsEngine.rendering.beautyRenderDelay;
        this.blurSceneWhenBusy = this._settingsEngine.general.blurWhenBusy;
        this.clearAlpha = this._settingsEngine.environment.clearAlpha;
        this.clearColor = this._converter.toColor(this._settingsEngine.environment.clearColor);

        if (sections.scene) {
          this.shadows = this._settingsEngine.rendering.shadows;
          this.ambientOcclusion = this._settingsEngine.rendering.ambientOcclusion;
          this.ambientOcclusionIntensity = this._settingsEngine.rendering.ambientOcclusionIntensity;
          this.gridColor = this._settingsEngine.environmentGeometry.gridColor;
          this.groundPlaneColor = this._settingsEngine.environmentGeometry.groundPlaneColor;
          this.outputEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.outputEncoding;
          this.physicallyCorrectLights = this._settingsEngine.rendering.physicallyCorrectLights;
          this.textureEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.textureEncoding;
          this.toneMapping = <TONE_MAPPING>this._settingsEngine.rendering.toneMapping;
          this.toneMappingExposure = this._settingsEngine.rendering.toneMappingExposure;
          this.gridVisibility = this._settingsEngine.environmentGeometry.gridVisibility;
          this.groundPlaneVisibility = this._settingsEngine.environmentGeometry.groundPlaneVisibility;
          this.pointSize = this._settingsEngine.general.pointSize;
        }

        if (sections.light) (<LightEngine>this.lightEngine).applySettings();
        if (sections.camera) (<CameraEngine>this.cameraEngine).applySettings();
        this._stateEngine.viewers[this.id].settingsLoaded.resolve(true);
        this.update();
      })

      // set it like this to not trigger the loading
      this._environmentMapResolution = this._settingsEngine.environment.mapResolution;
      this.environmentMap = this._settingsEngine.environment.map;
    } else {
      this.beautyRenderBlendingDuration = this._settingsEngine.rendering.beautyRenderBlendingDuration;
      this.beautyRenderDelay = this._settingsEngine.rendering.beautyRenderDelay;
      this.blurSceneWhenBusy = this._settingsEngine.general.blurWhenBusy;

      if (sections.scene) {
        this.shadows = this._settingsEngine.rendering.shadows;
        this.ambientOcclusion = this._settingsEngine.rendering.ambientOcclusion;
        this.ambientOcclusionIntensity = this._settingsEngine.rendering.ambientOcclusionIntensity;
        this.gridColor = this._settingsEngine.environmentGeometry.gridColor;
        this.groundPlaneColor = this._settingsEngine.environmentGeometry.groundPlaneColor;
        this.outputEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.outputEncoding;
        this.physicallyCorrectLights = this._settingsEngine.rendering.physicallyCorrectLights;
        this.textureEncoding = <TEXTURE_ENCODING>this._settingsEngine.rendering.textureEncoding;
        this.toneMapping = <TONE_MAPPING>this._settingsEngine.rendering.toneMapping;
        this.toneMappingExposure = this._settingsEngine.rendering.toneMappingExposure;
        this.gridVisibility = this._settingsEngine.environmentGeometry.gridVisibility;
        this.groundPlaneVisibility = this._settingsEngine.environmentGeometry.groundPlaneVisibility;
        this.pointSize = this._settingsEngine.general.pointSize;
      }

      if (sections.light) (<LightEngine>this.lightEngine).applySettings();
      if (sections.camera) (<CameraEngine>this.cameraEngine).applySettings();
      this._stateEngine.viewers[this.id].settingsLoaded.resolve(true);
      this.update();
    }
  }

  // #endregion Private Methods (1)
}