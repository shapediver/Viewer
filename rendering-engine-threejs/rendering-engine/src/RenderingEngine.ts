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
import { DomEventEngine, EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { MATERIAL_SIDE, MaterialData } from '@shapediver/viewer.shared.types'
import { Converter, SDError } from '@shapediver/viewer.shared.utils'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

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
    private _updateCBs: (() => void)[] = [];

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
        this._domEventEngine = new DomEventEngine(this.canvas.canvasElement);
        this._cameraEngine = new CameraEngine(this.canvas, this._domEventEngine);
        this._lightEngine = new LightEngine();

        // creation of the managers (all singleton engines were created already)
        this._beautyRenderingManager = new BeautyRenderingManager(this);
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
            this._stateEngine.primarySettingsRegistered.then(() => setTimeout(() => {
                if(this._closed) return;
                this.applySettings()
            }, 0));
        } else {
            this._stateEngine.primarySettingsRegistered.then(() => {
                if(this._closed) return;
                this.applySettings()
            });
        }       
    }

    // #endregion Constructors (1)

    // #region Public Accessors (61)

    /**
     * Getter ambientOcclusion
     * @return {boolean}
     */
    public get ambientOcclusion(): boolean {
        return this._ambientOcclusion;
    }

    /**
     * Setter ambientOcclusion
     * @param {boolean} value
     */
    public set ambientOcclusion(value: boolean) {
        this._ambientOcclusion = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter automaticResizing
     * @return {boolean}
     */
    public get automaticResizing(): boolean {
        return this._automaticResizing;
    }

    /**
     * Setter automaticResizing
     * @param {boolean} value
     */
    public set automaticResizing(value: boolean) {
        this._automaticResizing = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter beautyRenderBlendingDuration
     * @return {number}
     */
    public get beautyRenderBlendingDuration(): number {
        return this._beautyRenderBlendingDuration;
    }

    /**
     * Setter beautyRenderBlendingDuration
     * @param {number} value
     */
    public set beautyRenderBlendingDuration(value: number) {
        this._beautyRenderBlendingDuration = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter beautyRenderDelay
     * @return {number}
     */
    public get beautyRenderDelay(): number {
        return this._beautyRenderDelay;
    }

    /**
     * Setter beautyRenderDelay
     * @param {number} value
     */
    public set beautyRenderDelay(value: number) {
        this._beautyRenderDelay = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter beautyRenderingManager
     * @return {BeautyRenderingManager}
     */
    public get beautyRenderingManager(): BeautyRenderingManager {
        return this._beautyRenderingManager;
    }

    /**
     * Getter blur
     * @return {boolean}
     */
    public get blur(): boolean {
        return this._blur;
    }

    /**
     * Setter blur
     * @param {boolean} value
     */
    public set blur(value: boolean) {
        this._blur = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter blurSceneWhenBusy
     * @return {boolean}
     */
    public get blurSceneWhenBusy(): boolean {
        return this._blurSceneWhenBusy;
    }

    /**
     * Setter blurSceneWhenBusy
     * @param {boolean} value
     */
    public set blurSceneWhenBusy(value: boolean) {
        this._blurSceneWhenBusy = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter cameraEngine
     * @return {CameraEngine}
     */
    public get cameraEngine(): CameraEngine {
        return this._cameraEngine;
    }

    /**
     * Getter canvas
     * @return {ICanvas}
     */
    public get canvas(): ICanvas {
        return this._canvas;
    }

    /**
     * Getter canvasEngine
     * @return {CanvasEngine}
     */
    public get canvasEngine(): CanvasEngine {
        return this._canvasEngine;
    }

    /**
     * Getter clearAlpha
     * @return {number}
     */
    public get clearAlpha(): number {
        return this._clearAlpha;
    }

    /**
     * Setter clearAlpha
     * @param {number} value
     */
    public set clearAlpha(value: number) {
        this._clearAlpha = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter clearColor
     * @return {string}
     */
    public get clearColor(): string {
        return this._clearColor;
    }

    /**
     * Setter clearColor
     * @param {string} value
     */
    public set clearColor(value: string) {
        this._clearColor = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter closed
     * @return {boolean}
     */
    public get closed(): boolean {
        return this._closed;
    }

    /**
     * Getter domEventEngine
     * @return {DomEventEngine}
     */
    public get domEventEngine(): DomEventEngine {
        return this._domEventEngine;
    }

    /**
     * Getter environmentMap
     * @return {string | string[]}
     */
    public get environmentMap(): string | string[] {
        return this._environmentMap;
    }

    /**
     * Setter environmentMap
     * @param {string | string[]} value
     */
    public set environmentMap(value: string | string[]) {
        this._environmentMap = value;
        this._environmentMapLoader.load(this.environmentMap);
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter environmentMapAsBackground
     * @return {boolean}
     */
    public get environmentMapAsBackground(): boolean {
        return this._environmentMapAsBackground;
    }

    /**
     * Setter environmentMapAsBackground
     * @param {boolean} value
     */
    public set environmentMapAsBackground(value: boolean) {
        this._environmentMapAsBackground = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter environmentMapLoader
     * @return {EnvironmentMapLoader}
     */
    public get environmentMapLoader(): EnvironmentMapLoader {
        return this._environmentMapLoader;
    }

    /**
     * Getter environmentMapResolution
     * @return {string}
     */
    public get environmentMapResolution(): string {
        return this._environmentMapResolution;
    }

    /**
     * Setter environmentMapResolution
     * @param {string} value
     */
    public set environmentMapResolution(value: string) {
        this._environmentMapResolution = value;
        this._environmentMapLoader.load(this.environmentMap);
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter eventEngine
     * @return {EventEngine}
     */
    public get eventEngine(): EventEngine {
        return this._eventEngine;
    }

    /**
     * Getter geometryLoader
     * @return {GeometryLoader}
     */
    public get geometryLoader(): GeometryLoader {
        return this._geometryLoader;
    }

    /**
     * Getter gridVisibility
     * @return {boolean}
     */
    public get gridVisibility(): boolean {
        return this._gridVisibility;
    }

    /**
     * Setter gridVisibility
     * @param {boolean} value
     */
    public set gridVisibility(value: boolean) {
        if (this._environmentGeometryManager.grid) this._environmentGeometryManager.grid.visible = value;
        this._gridVisibility = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter groundPlaneVisibility
     * @return {boolean}
     */
    public get groundPlaneVisibility(): boolean {
        return this._groundPlaneVisibility;
    }

    /**
     * Setter groundPlaneVisibility
     * @param {boolean} value
     */
    public set groundPlaneVisibility(value: boolean) {
        if (this._environmentGeometryManager.groundPlane) this._environmentGeometryManager.groundPlane.visible = value;
        this._groundPlaneVisibility = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter htmlElementAnchorLoader
     * @return {HTMLElementAnchorLoader}
     */
    public get htmlElementAnchorLoader(): HTMLElementAnchorLoader {
        return this._htmlElementAnchorLoader;
    }

    /**
     * Getter id
     * @return {string}
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Getter lightEngine
     * @return {LightEngine}
     */
    public get lightEngine(): LightEngine {
        return this._lightEngine;
    }

    /**
     * Getter lightLoader
     * @return {LightLoader}
     */
    public get lightLoader(): LightLoader {
        return this._lightLoader;
    }

    /**
     * Getter lightScene
     * @return {string}
     */
    public get lightScene(): string {
        return this._lightScene;
    }

    /**
     * Setter lightScene
     * @param {string} value
     */
    public set lightScene(value: string) {
        this._lightScene = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter logoDivElement
     * @return {HTMLDivElement}
     */
    public get logoDivElement(): HTMLDivElement {
        return this._logoDivElement;
    }

    /**
     * Getter materialLoader
     * @return {MaterialLoader}
     */
    public get materialLoader(): MaterialLoader {
        return this._materialLoader;
    }

    /**
     * Getter minimalRendering
     * @return {boolean}
     */
    public get minimalRendering(): boolean {
        return this.renderingManager.minimalRendering;
    }

    /**
     * Getter pointSize
     * @return {number}
     */
    public get pointSize(): number {
        return this._pointSize;
    }

    /**
     * Setter pointSize
     * @param {number} value
     */
    public set pointSize(value: number) {
        this._pointSize = value;
        this.materialLoader.assignPointSize(value)
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter renderer
     * @return {THREE.WebGLRenderer}
     */
    public get renderer(): THREE.WebGLRenderer {
        return this._renderer;
    }

    /**
     * Getter renderingManager
     * @return {RenderingManager}
     */
    public get renderingManager(): RenderingManager {
        return this._renderingManager;
    }

    /**
     * Getter renderingSettings
     * @return {any}
     */
    public get renderingSettings(): any {
        return this._renderingSettings;
    }

    /**
     * Setter renderingSettings
     * @param {any} value
     */
    public set renderingSettings(value: any) {
        this._renderingSettings = value;
        if(value.physicallyCorrectLights !== undefined)
            this._renderer.physicallyCorrectLights = value.physicallyCorrectLights;
        if(value.outputEncoding !== undefined)
            this._renderer.outputEncoding = value.outputEncoding;
        if(value.textureEncoding !== undefined)
            this._materialLoader.assignTextureEncoding(value.textureEncoding);
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter scene
     * @return {THREE.Scene}
     */
    public get scene(): THREE.Scene {
        return this._sceneTreeManager.scene;
    }

    /**
     * Getter sceneTracingManager
     * @return {SceneTracingManager}
     */
    public get sceneTracingManager(): SceneTracingManager {
        return this._sceneTracingManager;
    }

    /**
     * Getter sceneTreeManager
     * @return {SceneTreeManager}
     */
    public get sceneTreeManager(): SceneTreeManager {
        return this._sceneTreeManager;
    }

    /**
     * Getter settingsEngine
     * @return {SettingsEngine}
     */
    public get settingsEngine(): SettingsEngine {
        return this._settingsEngine;
    }

    /**
     * Getter shadows
     * @return {boolean}
     */
    public get shadows(): boolean {
        return this._shadows;
    }

    /**
     * Setter shadows
     * @param {boolean} value
     */
    public set shadows(value: boolean) {
        this._shadows = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter show
     * @return {boolean}
     */
    public get show(): boolean {
        return this._show;
    }

    /**
     * Setter show
     * @param {boolean} value
     */
    public set show(value: boolean) {
        this._show = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter showStatistics
     * @return {boolean}
     */
    public get showStatistics(): boolean {
        return this._showStatistics;
    }

    /**
     * Setter showStatistics
     * @param {boolean} value
     */
    public set showStatistics(value: boolean) {
        this._showStatistics = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter stateEngine
     * @return {StateEngine}
     */
    public get stateEngine(): StateEngine {
        return this._stateEngine;
    }

    /**
     * Getter usingSwiftShader
     * @return {boolean}
     */
    public get usingSwiftShader(): boolean {
        return this.renderingManager.usingSwiftShader;
    }

    // #endregion Public Accessors (61)

    // #region Public Methods (10)

    public addUpdateCB(value: () => void) {
        this._updateCBs.push(value)
    }

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

        this._settingsEngine.general.viewer.blurSceneWhenBusy.value = this.blurSceneWhenBusy;
        this._settingsEngine.scene.gridVisibility.value = this.gridVisibility;
        this._settingsEngine.scene.groundPlaneVisibility.value = this.groundPlaneVisibility;
        this._settingsEngine.scene.lights.lightScene.value = this.lightScene;
        this._settingsEngine.scene.material.environmentMapResolution.value = this.environmentMapResolution;
        this._settingsEngine.scene.material.environmentMap.value = Array.isArray(this.environmentMap) ? JSON.stringify(this.environmentMap) : this.environmentMap;
        this._settingsEngine.scene.material.environmentMapAsBackground.value = this.environmentMapAsBackground;
        this._settingsEngine.scene.render.ambientOcclusion.value = this.ambientOcclusion;
        this._settingsEngine.scene.render.beautyRenderBlendingDuration.value = this.beautyRenderBlendingDuration;
        this._settingsEngine.scene.render.beautyRenderDelay.value = this.beautyRenderDelay;
        this._settingsEngine.scene.render.clearAlpha.value = this.clearAlpha;
        this._settingsEngine.scene.render.clearColor.value = this.clearColor;
        this._settingsEngine.scene.render.pointSize.value = this.pointSize;
        this._settingsEngine.scene.render.shadows.value = this.shadows;

        const camera = this.cameraEngine.getCamera();
        if (camera) {
            this._settingsEngine.scene.camera.autoAdjust.value = camera.autoAdjust;
            this._settingsEngine.scene.camera.cameraMovementDuration.value = camera.cameraMovementDuration;
            this._settingsEngine.scene.camera.enableCameraControls.value = camera.enableCameraControls;
            this._settingsEngine.scene.camera.revertAtMouseUp.value = camera.revertAtMouseUp;
            this._settingsEngine.scene.camera.revertAtMouseUpDuration.value = camera.revertAtMouseUpDuration;
            this._settingsEngine.scene.camera.zoomExtentsFactor.value = camera.zoomExtentsFactor;

            if (camera.type === CAMERATYPE.PERSPECTIVE) {
                this._settingsEngine.scene.camera.cameraTypes.active.value = 0;
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.position = { x: camera.defaultPosition[0], y: camera.defaultPosition[1], z: camera.defaultPosition[2] };
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.target = { x: camera.defaultTarget[0], y: camera.defaultTarget[1], z: camera.defaultTarget[2] };
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position = { x: 0, y: 0, z: 0 };
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target = { x: 0, y: 0, z: 0 };
                this._settingsEngine.scene.camera.cameraTypes.perspective.fov.value = (<PerspectiveCamera>camera).fov;

                const controls = <PerspectiveCameraControls>(<PerspectiveCamera>camera).controls;
                this._settingsEngine.scene.camera.controls.orbit.autoRotationSpeed.value = controls.autoRotationSpeed;
                this._settingsEngine.scene.camera.controls.orbit.damping.value = controls.damping;
                this._settingsEngine.scene.camera.controls.orbit.enableAutoRotation.value = controls.enableAutoRotation;
                this._settingsEngine.scene.camera.controls.orbit.enableKeyPan.value = controls.enableKeyPan;
                this._settingsEngine.scene.camera.controls.orbit.enablePan.value = controls.enablePan;
                this._settingsEngine.scene.camera.controls.orbit.enableRotation.value = controls.enableRotation;
                this._settingsEngine.scene.camera.controls.orbit.enableZoom.value = controls.enableZoom;
                this._settingsEngine.scene.camera.controls.orbit.input.value = controls.input;
                this._settingsEngine.scene.camera.controls.orbit.keyPanSpeed.value = controls.keyPanSpeed;
                this._settingsEngine.scene.camera.controls.orbit.movementSmoothness.value = controls.movementSmoothness;
                this._settingsEngine.scene.camera.controls.orbit.rotationSpeed.value = controls.rotationSpeed;
                this._settingsEngine.scene.camera.controls.orbit.panSpeed.value = controls.panSpeed;
                this._settingsEngine.scene.camera.controls.orbit.zoomSpeed.value = controls.zoomSpeed;

                this._settingsEngine.scene.camera.controls.orbit.restrictions.position.cube.value = {
                    min: { x: controls.cubePositionRestriction.min[0], y: controls.cubePositionRestriction.min[1], z: controls.cubePositionRestriction.min[2] },
                    max: { x: controls.cubePositionRestriction.max[0], y: controls.cubePositionRestriction.max[1], z: controls.cubePositionRestriction.max[2] },
                };
                this._settingsEngine.scene.camera.controls.orbit.restrictions.position.sphere.value = {
                    center: { x: controls.spherePositionRestriction.center[0], y: controls.spherePositionRestriction.center[1], z: controls.spherePositionRestriction.center[2] },
                    radius: controls.spherePositionRestriction.radius,
                };
                this._settingsEngine.scene.camera.controls.orbit.restrictions.target.cube.value = {
                    min: { x: controls.cubeTargetRestriction.min[0], y: controls.cubeTargetRestriction.min[1], z: controls.cubeTargetRestriction.min[2] },
                    max: { x: controls.cubeTargetRestriction.max[0], y: controls.cubeTargetRestriction.max[1], z: controls.cubeTargetRestriction.max[2] },
                };
                this._settingsEngine.scene.camera.controls.orbit.restrictions.target.sphere.value = {
                    center: { x: controls.sphereTargetRestriction.center[0], y: controls.sphereTargetRestriction.center[1], z: controls.sphereTargetRestriction.center[2] },
                    radius: controls.sphereTargetRestriction.radius,
                };
                this._settingsEngine.scene.camera.controls.orbit.restrictions.rotation.value = controls.rotationRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.zoom.value = controls.zoomRestriction;

            } else {
                const previousDirection = this._settingsEngine.scene.camera.cameraTypes.active.value;
                switch((<OrthographicCamera>camera).direction) {
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 1;
                        break;
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 2;
                        break;
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 3;
                        break;
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 4;
                        break;
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 5;
                        break;
                    case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
                        this._settingsEngine.scene.camera.cameraTypes.active.value = 6;
                        break;
                }

                // if the direction changed, but the default position & target did not, there is an issue
                if(previousDirection !== this._settingsEngine.scene.camera.cameraTypes.active.value && (
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position.x === camera.defaultPosition[0] &&
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position.y === camera.defaultPosition[1] &&
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position.z === camera.defaultPosition[2] &&
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target.x === camera.defaultTarget[0] &&
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target.y === camera.defaultTarget[1] &&
                    this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target.z === camera.defaultTarget[2]
                )) {
                    camera.defaultPosition = vec3.clone(camera.position);
                    camera.defaultTarget = vec3.clone(camera.target);
                }

                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position = { x: camera.defaultPosition[0], y: camera.defaultPosition[1], z: camera.defaultPosition[2] };
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target = { x: camera.defaultTarget[0], y: camera.defaultTarget[1], z: camera.defaultTarget[2] };
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.position = { x: 0, y: 0, z: 0 };
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.target = { x: 0, y: 0, z: 0 };
                
                const controls = <OrthographicCameraControls>(<OrthographicCamera>camera).controls;
                this._settingsEngine.scene.camera.controls.orthographic.damping.value = controls.damping;
                this._settingsEngine.scene.camera.controls.orthographic.enableKeyPan.value = controls.enableKeyPan;
                this._settingsEngine.scene.camera.controls.orthographic.enablePan.value = controls.enablePan;
                this._settingsEngine.scene.camera.controls.orthographic.enableZoom.value = controls.enableZoom;
                this._settingsEngine.scene.camera.controls.orthographic.input.value = controls.input;
                this._settingsEngine.scene.camera.controls.orthographic.keyPanSpeed.value = controls.keyPanSpeed;
                this._settingsEngine.scene.camera.controls.orthographic.movementSmoothness.value = controls.movementSmoothness;
                this._settingsEngine.scene.camera.controls.orthographic.panSpeed.value = controls.panSpeed;
                this._settingsEngine.scene.camera.controls.orthographic.zoomSpeed.value = controls.zoomSpeed;
            }
        }
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
        const token = this._eventEngine.addListener(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, (e: any) => {
            // return if a different env map was loaded
            if (!e.name || (e.name && e.name !== this._settingsEngine.scene.material.environmentMap.value)) return;

            this.environmentMapAsBackground = this._settingsEngine.scene.material.environmentMapAsBackground.value;
            this.ambientOcclusion = this._settingsEngine.scene.render.ambientOcclusion.value;
            this.beautyRenderBlendingDuration = this._settingsEngine.scene.render.beautyRenderBlendingDuration.value;
            this.beautyRenderDelay = this._settingsEngine.scene.render.beautyRenderDelay.value;
            this.blurSceneWhenBusy = this._settingsEngine.general.viewer.blurSceneWhenBusy.value;
            this.clearAlpha = this._settingsEngine.scene.render.clearAlpha.value;
            this.clearColor = this._converter.toColor(this._settingsEngine.scene.render.clearColor.value);
            this.gridVisibility = this._settingsEngine.scene.gridVisibility.value;
            this.groundPlaneVisibility = this._settingsEngine.scene.groundPlaneVisibility.value;
            this.lightScene = this._settingsEngine.scene.lights.lightScene.value;
            this.pointSize = this._settingsEngine.rendering.pointSize.value;
            this.shadows = this._settingsEngine.scene.render.shadows.value;
            this._eventEngine.removeListener(token);
            (<LightEngine>this.lightEngine).applySettings();
            (<CameraEngine>this.cameraEngine).applySettings();
            this._stateEngine.getCustomState(this.id + '_settings_loaded').resolve(true);
            this._updateCBs.forEach(v => v());
            this.update();
        })

        // set it like this to not trigger the loading
        this._environmentMapResolution = this._settingsEngine.scene.material.environmentMapResolution.value;
        this.environmentMap = this._settingsEngine.scene.material.environmentMap.value;
        this._updateCBs.forEach(v => v());
    }

    // #endregion Private Methods (2)
}