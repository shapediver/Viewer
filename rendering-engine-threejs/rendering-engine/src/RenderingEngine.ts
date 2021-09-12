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
import { IRenderingEngine, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { DomEventEngine, EventEngine, EVENTTYPE, IEvent, IViewerEvent, SettingsEngine, StateEngine, Converter, SDError, Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.services'
import { MATERIAL_SIDE, MaterialData } from '@shapediver/viewer.shared.types'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'

import { SceneTreeManager } from './managers/SceneTreeManager'
import { SDObject } from './types/SDObject'
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

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (51)

    // utils
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    // engines
    private readonly _cameraEngine: CameraEngine;
    private readonly _canvasEngine: CanvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
    private readonly _domEventEngine: DomEventEngine;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _lightEngine: LightEngine;
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // managers
    private readonly _beautyRenderingManager: BeautyRenderingManager;
    private readonly _cameraManager: CameraManager;
    private readonly _environmentGeometryManager: EnvironmentGeometryManager;
    private readonly _renderingManager: RenderingManager;
    private readonly _sceneTracingManager: SceneTracingManager;
    private readonly _sceneTreeManager: SceneTreeManager;

    // loaders
    private readonly _environmentMapLoader: EnvironmentMapLoader;
    private readonly _geometryLoader: GeometryLoader;
    private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
    private readonly _lightLoader: LightLoader;
    private readonly _materialLoader: MaterialLoader;

    // viewer essentials
    private readonly _canvas: ICanvas;
    private readonly _tree: Tree = <Tree>container.resolve(Tree);
    private readonly _renderer: THREE.WebGLRenderer;

    // constructor properties
    private readonly _id: string;
    private readonly _logo: string;
    private readonly _visibility: VISIBILITYMODE;

    // settings
    private _ambientOcclusion: boolean = true;
    private _automaticResizing: boolean = true;
    private _beautyRenderBlendingDuration: number = 1500;
    private _beautyRenderDelay: number = 50;
    private _blur: boolean = false;
    private _blurSceneWhenBusy: boolean = true;
    private _busy: boolean = false;
    private _clearAlpha: number = 1.0;
    private _clearColor: string = '#ffffff';
    private _environmentMap: string | string[] = 'none';
    private _environmentMapAsBackground: boolean = false;
    private _environmentMapResolution: string = '1024';
    private _gridVisibility: boolean = true;
    private _groundPlaneVisibility: boolean = true;
    private _lightScene: string = 'standard';
    private _pointSize: number = 1.0;
    private _renderingSettings: {
        physicallyCorrectLights: boolean,
        textureEncoding: number,
        outputEncoding: number
    } = {
        physicallyCorrectLights: false,
        textureEncoding: THREE.LinearEncoding,
        outputEncoding: THREE.LinearEncoding
    };
    private _shadows: boolean = true;
    private _show: boolean = false;
    private _showStatistics: boolean = false;

    // viewer global vars
    private _closed: boolean = false;
    private _logoDivElement: HTMLDivElement;

    // #endregion Properties (51)

    // #region Constructors (1)

    constructor(properties: { id: string, canvas?: string | HTMLCanvasElement, visibility: VISIBILITYMODE, logo: string }) {
        // THREE object has default Y, we change that (although it doesn't work everywhere)
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

        // setting some of the provided properties
        this._id = properties.id;
        this._visibility = properties.visibility;
        this._logo = properties.logo;

        // creation of viewer essentials
        this._canvas = this._canvasEngine.getCanvas(this._canvasEngine.createCanvasObject(properties.canvas));

        // creation of the engines (all singleton engines were created already)
        this._domEventEngine = new DomEventEngine(this._id, this.canvas.canvasElement);
        this._cameraEngine = new CameraEngine(this._id, this.canvas, this._domEventEngine);
        this._lightEngine = new LightEngine(this._id);

        // creation of the managers (all singleton engines were created already)
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
        this._logoDivElement = this.renderingManager.addLogo(this._canvas.canvasElement, this._logo);

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

        this._stateEngine.createCustomState(this.id + '_settings_loaded');

        if (this._visibility === VISIBILITYMODE.INSTANT) this.show = true;

        if (this._visibility === VISIBILITYMODE.SESSION) {
            this._stateEngine.primarySessionLoaded.then(() => {
                if(this._closed) return;
                // wait for settings to load before showing the scene
                this._stateEngine.getCustomState(this.id + '_settings_loaded').then(() => {
                    if(this._closed) return;
                    this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox);
                    this.show = true;
                })
            })
        }
        if(this._stateEngine.primarySettingsRegistered.resolved) {
            if(this._closed) return;
            this.applySettings()
        } else {
            this._stateEngine.primarySettingsRegistered.then(() => {
                if(this._closed) return;
                this.applySettings()
            });
        }       
        
        this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED_EXTERNAL, (e) => { 
            if(this._closed) return;
            this.applySettings();
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (61)

    public get ambientOcclusion(): boolean {
        return this._ambientOcclusion;
    }

    public set ambientOcclusion(value: boolean) {
        this._ambientOcclusion = value;
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

    public get canvas(): ICanvas {
        return this._canvas;
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

    public get gridVisibility(): boolean {
        return this._gridVisibility;
    }

    public set gridVisibility(value: boolean) {
        if (this._environmentGeometryManager.grid) this._environmentGeometryManager.grid.visible = value;
        this._gridVisibility = value;
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
        return this._lightScene;
    }

    public set lightScene(value: string) {
        this._lightScene = value;
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

    public get renderingSettings(): any {
        return this._renderingSettings;
    }

    public set renderingSettings(value: any) {
        this._renderingSettings = value;
        if(value.envMapIntensity !== undefined)
            this._materialLoader.assignEnvironmentMapIntensity(value.envMapIntensity);
        if(value.envMapIntensityGroundPlane !== undefined)
            this._environmentGeometryManager.assignGroundPlaneEnvironmentIntensity(value.envMapIntensityGroundPlane);
        if(value.groundPlaneColor !== undefined)
            this._environmentGeometryManager.assignGroundPlaneColor(value.groundPlaneColor)
        if(value.toneMapping !== undefined)
            this._renderer.toneMapping = value.toneMapping;
        if(value.toneMappingExposure !== undefined)
            this._renderer.toneMappingExposure = value.toneMappingExposure;
        if(value.physicallyCorrectLights !== undefined)
            this._renderer.physicallyCorrectLights = value.physicallyCorrectLights;
        if(value.outputEncoding !== undefined) {
            this._renderer.outputEncoding = value.outputEncoding;

            if(value.outputEncoding === 3000 || value.outputEncoding === 3001) {
                this._beautyRenderingManager.assignOutputEncoding(value.outputEncoding)
            } else {
                this._logger.warn(LOGGINGTOPIC.VIEWER, 'Output encoding of this type cannot be used in combination with Ambient Occlusion at the moment.')
            }
        }
        if(value.textureEncoding !== undefined)
            this._materialLoader.assignTextureEncoding(value.textureEncoding);
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

    public get usingSwiftShader(): boolean {
        return this.renderingManager.usingSwiftShader;
    }

    // #endregion Public Accessors (61)

    // #region Public Methods (10)

    public async close(): Promise<boolean> {
        this._closed = true;
        this._canvas.canvasElement.parentElement?.removeChild(this._logoDivElement);
        this._canvas.canvasElement.parentNode?.removeChild(this._htmlElementAnchorLoader.parentDiv);
        this._canvas.reset();
        this._domEventEngine.removeAllDomEventListener();
        this._domEventEngine.dispose();
        return true;
    }

    public getScreenshot(type?: string, encoderOptions?: number): string {
        return this._renderingManager.getScreenshot(type, encoderOptions);
    }

    public reset() {
        this._environmentGeometryManager.changeSceneExtents(this._sceneTreeManager.boundingBox)
        if(this._visibility === VISIBILITYMODE.SESSION) this.show = false;
        this._stateEngine.getCustomState(this.id + '_settings_loaded').reset();
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
        this._settingsEngine.light.lightSceneId = this.lightScene;
        this._settingsEngine.environment.mapResolution = this.environmentMapResolution;
        this._settingsEngine.environment.map = Array.isArray(this.environmentMap) ? JSON.stringify(this.environmentMap) : this.environmentMap;
        this._settingsEngine.environment.mapAsBackground = this.environmentMapAsBackground;
        this._settingsEngine.rendering.ambientOcclusion = this.ambientOcclusion;
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
        this._renderingManager.render();
    }

    // #endregion Public Methods (10)

    // #region Private Methods (2)

    private applySettings() {
        // as the environment map is the only thing that needs time to load, load it first
        const token = this._eventEngine.addListener(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, (e: IEvent) => {
            const viewerEvent = <IViewerEvent>e;
            if(viewerEvent.viewerId !== this.id) return;

            this._eventEngine.removeListener(token);
            // return if a different env map was loaded
            if (!viewerEvent.environmentMapId || (viewerEvent.environmentMapId && viewerEvent.environmentMapId !== this._settingsEngine.environment.map)) return;

            this.environmentMapAsBackground = this._settingsEngine.environment.mapAsBackground;
            this.ambientOcclusion = this._settingsEngine.rendering.ambientOcclusion;
            this.beautyRenderBlendingDuration = this._settingsEngine.rendering.beautyRenderBlendingDuration;
            this.beautyRenderDelay = this._settingsEngine.rendering.beautyRenderDelay;
            this.blurSceneWhenBusy = this._settingsEngine.general.blurWhenBusy;
            this.clearAlpha = this._settingsEngine.environment.clearAlpha;
            this.clearColor = this._converter.toColor(this._settingsEngine.environment.clearColor);
            this.gridVisibility = this._settingsEngine.environmentGeometry.gridVisibility;
            this.groundPlaneVisibility = this._settingsEngine.environmentGeometry.groundPlaneVisibility;
            this.lightScene = this._settingsEngine.light.lightSceneId;
            this.pointSize = this._settingsEngine.general.pointSize;
            this.shadows = this._settingsEngine.rendering.shadows;
            (<LightEngine>this.lightEngine).applySettings();
            (<CameraEngine>this.cameraEngine).applySettings();
            this._stateEngine.getCustomState(this.id + '_settings_loaded').resolve(true);
            this.update();
        })

        // set it like this to not trigger the loading
        this._environmentMapResolution = this._settingsEngine.environment.mapResolution;
        this.environmentMap = this._settingsEngine.environment.map;
    }

    // #endregion Private Methods (2)
}