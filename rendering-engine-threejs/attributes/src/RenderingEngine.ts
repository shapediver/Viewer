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
import { DomEventEngine, EventEngine, EVENTTYPE, IEvent, SettingsEngine, StateEngine, Converter, SDError, Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.services'
import { MATERIAL_SIDE, MaterialData, SDTFAttributeOverview, SDTFItemData, SDTFOverview, SDTFAttributeVisualizationData, ISettingsEvent } from '@shapediver/viewer.shared.types'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'

import { SceneTreeManager } from './managers/SceneTreeManager'
import { SDObject } from './types/SDObject'
import { RenderingManager } from './managers/RenderingManager'
import { MaterialLoader } from './loaders/MaterialLoader'
import { GeometryLoader } from './loaders/GeometryLoader'
import { LightLoader } from './loaders/LightLoader'
import { SceneTracingManager } from './managers/SceneTracingManager'
import { CameraManager } from './managers/CameraManager'
import { IRenderingEngineAttributes } from './interfaces/IRenderingEngine'

export class RenderingEngine implements IRenderingEngineAttributes {
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
    private readonly _cameraManager: CameraManager;
    private readonly _renderingManager: RenderingManager;
    private readonly _sceneTracingManager: SceneTracingManager;
    private readonly _sceneTreeManager: SceneTreeManager;

    // loaders
    private readonly _geometryLoader: GeometryLoader;
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
    private _automaticResizing: boolean = true;
    private _blur: boolean = false;
    private _blurSceneWhenBusy: boolean = true;
    private _busy: boolean = false;
    private _lightScene: string = 'standard';
    private _pointSize: number = 1.0;
    private _show: boolean = false;
    private _showStatistics: boolean = false;

    // viewer global vars
    private _closed: boolean = false;
    private _logoDivElement: HTMLDivElement;
    private _visualizationAttributes: { [key: string]: boolean } = {};
    private _convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined;

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
        this._cameraManager = new CameraManager(this);
        this._sceneTracingManager = new SceneTracingManager(this);
        this._sceneTreeManager = new SceneTreeManager(this);
        this._renderingManager = new RenderingManager(this);

        // loaders
        this._materialLoader = new MaterialLoader(this);
        this._geometryLoader = new GeometryLoader(this);
        this._lightLoader = new LightLoader(this);

        // start the creation and initialization process 
        this._renderer = this.renderingManager.createRenderer(this._canvas.canvasElement);
        this._logoDivElement = this.renderingManager.addLogo(this._canvas.canvasElement, this._logo);

        // creation of the managers (all singleton engines were created already)
        this._cameraManager.init();
        this._sceneTracingManager.init();
        this._sceneTreeManager.init();
        this._renderingManager.init();

        // loaders
        this._materialLoader.init();
        this._geometryLoader.init();
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
            const sessionEvent = <ISettingsEvent>e;
            this.applySettings(sessionEvent.sections?.viewer!);
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (61)
    public get automaticResizing(): boolean {
        return this._automaticResizing;
    }

    public set automaticResizing(value: boolean) {
        this._automaticResizing = value;
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

    public get convertSDTFItemToVisualizationData(): ((itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined {
        return this._convertSDTFItemToVisualizationData;
    }

    public set convertSDTFItemToVisualizationData(value: ((itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined) {
        this._convertSDTFItemToVisualizationData = value;
    }

    public get closed(): boolean {
        return this._closed;
    }

    public get domEventEngine(): DomEventEngine {
        return this._domEventEngine;
    }

    public get eventEngine(): EventEngine {
        return this._eventEngine;
    }

    public get geometryLoader(): GeometryLoader {
        return this._geometryLoader;
    }

    public get id(): string {
        return this._id;
    }

    public get lightEngine(): LightEngine {
        return this._lightEngine;
    }

    public get lightSceneId(): string {
        return this._lightEngine.lightScene!.id;
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

    public get visualizationAttributes(): {
        [key: string]: boolean
      } {
        return this._visualizationAttributes;
    }

    public set visualizationAttributes(value: {
        [key: string]: boolean
      }) {
        const overview = this.createSDTFOverview();
        for(let key in overview) {
            if(value[key]) {
                this._visualizationAttributes[key] = value[key];
            } else {
                this._visualizationAttributes[key] = false;
                this._logger.info(LOGGINGTOPIC.VIEWER, `VisualizationAttributes does not have Attribute ${key}. Visualization set to false.`)
            }
        }

        for(let key in this._visualizationAttributes) {
            if(!overview[key])
                delete this._visualizationAttributes[key];
        }
    }

    // #endregion Public Accessors (61)

    // #region Public Methods (10)

    public createSDTFOverview(node: TreeNode = this._tree.root): SDTFOverview {
        const out: SDTFAttributeOverview = new SDTFAttributeOverview({});
        for (let i = 0, len = node.data.length; i < len; i++)
            if (node.data[i] instanceof SDTFAttributeOverview)
                out.merge(<SDTFAttributeOverview>node.data[i])

        for (let i = 0, len = node.children.length; i < len; i++)
            out.merge(new SDTFAttributeOverview(this.createSDTFOverview(node.children[i])));

        return out.overview;
    }

    public async close(): Promise<boolean> {
        this._closed = true;
        this._canvas.canvasElement.parentElement?.removeChild(this._logoDivElement);
        this._canvas.reset();
        this._domEventEngine.removeAllDomEventListener();
        this._domEventEngine.dispose();
        return true;
    }

    public getScreenshot(type?: string, encoderOptions?: number): string {
        return this._renderingManager.getScreenshot(type, encoderOptions);
    }

    public reset() {
        if(this._visibility === VISIBILITYMODE.SESSION) this.show = false;
        this._stateEngine.getCustomState(this.id + '_settings_loaded').reset();
    }

    public resize(width: number, height: number): void {
        this._renderingManager.resize(width, height);
        this._renderingManager.render();
    }

    public saveSettings() {
        // (<LightEngine>this.lightEngine).saveSettings();
        // (<CameraEngine>this.cameraEngine).saveSettings();

        // this._settingsEngine.general.blurWhenBusy = this.blurSceneWhenBusy;
        // this._settingsEngine.light.lightSceneId = this.lightScene;
        // this._settingsEngine.general.pointSize = this.pointSize;
    }

    public update(): void {
        this._sceneTreeManager.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
        this._renderingManager.updateShadowMap();
        this._renderingManager.render();
    }

    // #endregion Public Methods (10)

    // #region Private Methods (2)

    private applySettings(sections: { camera?: boolean, lights?: boolean, scene?: boolean, environment?: boolean } = { camera: true, lights: true, scene: true, environment: true }) {
        this.blurSceneWhenBusy = this._settingsEngine.general.blurWhenBusy;
        if(sections.lights) this.lightScene = this._settingsEngine.light.lightSceneId;
        if(sections.scene) this.pointSize = this._settingsEngine.general.pointSize;
        if(sections.lights) (<LightEngine>this.lightEngine).applySettings();
        if(sections.camera) (<CameraEngine>this.cameraEngine).applySettings();
        this._stateEngine.getCustomState(this.id + '_settings_loaded').resolve(true);
        this.update();
    }

    // #endregion Private Methods (2)
}