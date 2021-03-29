import { vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.shared.node-tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { IRenderingEngine, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { StateEngine, SettingsEngine, DomEventEngine, EVENTTYPE, EventEngine } from '@shapediver/viewer.shared.services';
import { SDObject } from './types/SDObject';
import { MaterialData, MATERIAL_SIDE } from '@shapediver/viewer.shared.types';
import { RenderingLogic } from './RenderingLogic';
import { MaterialLoader } from './loaders/MaterialLoader';
import { Converter } from '@shapediver/viewer.shared.utils';
import { EnvironmentMapLoader } from './loaders/EnvironmentMapLoader';
import { GeometryLoader } from './loaders/GeometryLoader';
import { LightLoader } from './loaders/LightLoader';

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (39)

    private readonly _cameraEngine: CameraEngine;
    private readonly _canvasEngine: CanvasEngine;
    private readonly _converter: Converter;
    private readonly _domEventEngine: DomEventEngine;
    private readonly _environmentMapLoader: EnvironmentMapLoader;
    private readonly _eventEngine: EventEngine;
    private readonly _geometryLoader: GeometryLoader;
    private readonly _lightEngine: LightEngine;
    private readonly _lightLoader: LightLoader;
    private readonly _materialLoader: MaterialLoader;
    private readonly _renderingLogic: RenderingLogic;
    private readonly _settings: SettingsEngine;
    private readonly _stateEngine: StateEngine;
    private readonly _tree: Tree;
    private readonly _id: string;

    private _ambientOcclusion: boolean = true;
    private _beautyRenderBlendingDuration: number = 1500;
    private _beautyRenderDelay: number = 50;
    private _blurSceneWhenBusy: boolean = true;
    private _canvas!: Canvas;
    private _clearAlpha: number = 1.0;
    private _clearColor: vec3 = vec3.fromValues(1,1,1);
    private _duration: number = 0;
    private _environmentMap: string | string[] = 'none';
    private _environmentMapAsBackground: boolean = false;
    private _environmentMapResolution: string = '1024';
    private _fullscreen: boolean = false;
    private _grid!: THREE.GridHelper;
    private _gridVisibility: boolean = true;
    private _groundPlane!: THREE.Mesh;
    // private _groundPlaneReflectionThreshold: number = 0.01;
    // private _groundPlaneReflectionVisibility: boolean = false;
    private _groundPlaneVisibility: boolean = true;
    private _lightHelper: boolean = false;
    private _lightScene: string = 'default';
    private _logoDivElement: HTMLDivElement;
    private _pointSize: number = 1.0;
    private _sceneTree!: SceneTree;
    private _shadows: boolean = true;
    private _show: boolean = false;
    private readonly _visibility: VISIBILITYMODE;

    // #endregion Properties (39)

    // #region Constructors (1)

    constructor(properties: { id: string, canvas?: string | HTMLCanvasElement, visibility: VISIBILITYMODE }) {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
        this._id = properties.id;
        this._settings = <SettingsEngine>container.resolve(SettingsEngine);
        this._converter = <Converter>container.resolve(Converter);
        this._eventEngine = <EventEngine>container.resolve(EventEngine);
        this._stateEngine = <StateEngine>container.resolve(StateEngine);
        this._tree = <Tree>container.resolve(Tree);
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(properties.canvas);
        this._environmentMapLoader = new EnvironmentMapLoader(this);
        this._materialLoader = new MaterialLoader(this);
        this._geometryLoader = new GeometryLoader(this);
        this._lightLoader = new LightLoader(this);
        this._visibility = properties.visibility;

        this._logoDivElement = document.createElement('div');
        this._logoDivElement.style.background = '#030531';
        this._logoDivElement.style.position = 'absolute';
        this._logoDivElement.style.height = '100%';
        this._logoDivElement.style.width = '100%';
        this._canvas.canvasElement.parentElement?.insertBefore(this._logoDivElement, this._canvas.canvasElement.parentElement?.firstChild);

        const img = new Image();
        img.style.position = 'absolute';
        img.style.top = '50%';
        img.style.left = '50%';
        img.style.transform = 'translateX(-50%) translateY(-50%)';
        img.src = 'https://d2tuv7fwq0eipl.cloudfront.net/production/assets/img/icon_logo_white.png';
        this._logoDivElement.appendChild(img)

        this._domEventEngine = new DomEventEngine(this._canvas.canvasElement);

        this._lightEngine = new LightEngine();
        this._cameraEngine = new CameraEngine(this._canvas, this._domEventEngine);

        this._sceneTree = new SceneTree(this);

        (<SceneTree>this._sceneTree).scene.background = new THREE.Color(0xffffff);

        this._renderingLogic = new RenderingLogic(this);

        if(this._visibility === VISIBILITYMODE.INSTANT) this.show = true;

        if(this._visibility === VISIBILITYMODE.SESSION) {
            this._stateEngine.firstSessionInitialized.then(() => {
                // TODO if there are settings, wait if they are loaded
                this.show = true;
            })
        }

        this._stateEngine.boundingBoxCreated.then(() => this.init());
        this._stateEngine.settingsRegistered.then(() => this.applySettings());
    }

    // #endregion Constructors (1)

    // #region Public Accessors (50)

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
    }

    /**
     * Getter cameraEngine
     * @return {ICameraEngine}
     */
    public get cameraEngine(): ICameraEngine {
        return this._cameraEngine;
    }

    /**
     * Getter canvas
     * @return {Canvas}
     */
    public get canvas(): Canvas {
        return this._canvas;
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
    }

    /**
     * Getter clearColor
     * @return {vec3}
     */
    public get clearColor(): vec3 {
        return this._clearColor;
    }

    /**
     * Setter clearColor
     * @param {vec3} value
     */
    public set clearColor(value: vec3) {
        this._clearColor = value;
    }

    /**
     * Getter duration
     * @return {number}
     */
    public get duration(): number {
        return this._duration;
    }

    /**
     * Setter duration
     * @param {number} value
     */
    public set duration(value: number) {
        this._duration = value;
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
    }

    /**
     * Getter fullscreen
     * @return {boolean}
     */
    public get fullscreen(): boolean {
        return this._fullscreen;
    }

    /**
     * Setter fullscreen
     * @param {boolean} value
     */
    public set fullscreen(value: boolean) {
        this._fullscreen = value;
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
        if(this._grid) this._grid.visible = value;
        this._gridVisibility = value;
    }

    // /**
    //  * Getter groundPlaneReflectionThreshold
    //  * @return {number}
    //  */
    // public get groundPlaneReflectionThreshold(): number {
    //     return this._groundPlaneReflectionThreshold;
    // }

    // /**
    //  * Setter groundPlaneReflectionThreshold
    //  * @param {number} value
    //  */
    // public set groundPlaneReflectionThreshold(value: number) {
    //     this._groundPlaneReflectionThreshold = value;
    // }

    // /**
    //  * Getter groundPlaneReflectionVisibility
    //  * @return {boolean}
    //  */
    // public get groundPlaneReflectionVisibility(): boolean {
    //     return this._groundPlaneReflectionVisibility;
    // }

    // /**
    //  * Setter groundPlaneReflectionVisibility
    //  * @param {boolean} value
    //  */
    // public set groundPlaneReflectionVisibility(value: boolean) {
    //     this._groundPlaneReflectionVisibility = value;
    // }

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
        if(this._groundPlane) this._groundPlane.visible = value;
        this._groundPlaneVisibility = value;
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
     * @return {ILightEngine}
     */
    public get lightEngine(): ILightEngine {
        return this._lightEngine;
    }

    /**
     * Getter lightHelper
     * @return {boolean}
     */
    public get lightHelper(): boolean {
        return this._lightHelper;
    }

    /**
     * Setter lightHelper
     * @param {boolean} value
     */
    public set lightHelper(value: boolean) {
        this._lightHelper = value;
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
    }

    /**
     * Getter sceneTree
     * @return {SceneTree}
     */
    public get sceneTree(): SceneTree {
        return this._sceneTree;
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
    }

    // #endregion Public Accessors (50)

    // #region Public Methods (1)

    public update(): void {
        if (this._stateEngine.settingsRegistered.resolved !== true) return;
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
        this._renderingLogic.render();
    }

    // #endregion Public Methods (1)

    // #region Private Methods (2)

    private applySettings() {
        // TODO
        this.ambientOcclusion = this._settings.scene.render.ambientOcclusion.value;
        this.beautyRenderBlendingDuration = this._settings.scene.render.beautyRenderBlendingDuration.value;
        this.beautyRenderDelay = this._settings.scene.render.beautyRenderDelay.value;
        // TODO
        this.blurSceneWhenBusy = this._settings.general.blurSceneWhenBusy.value;
        this.clearAlpha = this._settings.scene.render.clearAlpha.value;
        const c = this._converter.toColor(this._settings.scene.render.clearColor.value);
        this.clearColor = vec3.fromValues(c[0], c[1], c[2]);
        // FIXME
        this.duration = this._settings.scene.duration.value;
        this.environmentMap = this._settings.scene.material.environmentMap.value;
        this.environmentMapAsBackground = this._settings.scene.material.environmentMapAsBackground.value;
        this.environmentMapResolution = this._settings.scene.material.environmentMapResolution.value;
        // FIXME
        this.fullscreen = this._settings.scene.fullscreen.value;
        this.gridVisibility = this._settings.scene.gridVisibility.value;
        // FIXME
        // this.groundPlaneReflectionThreshold = this._settings.scene.groundPlaneReflectionThreshold.value;
        // // FIXME
        // this.groundPlaneReflectionVisibility = this._settings.scene.groundPlaneReflectionVisibility.value;
        this.groundPlaneVisibility = this._settings.scene.groundPlaneVisibility.value;
        // FIXME
        this.lightHelper = this._settings.scene.lights.helper.value;
        this.lightScene = this._settings.scene.lights.lightScene.value;
        // TODO
        this.pointSize = this._settings.rendering.pointSize.value;
        this.shadows = this._settings.scene.render.shadows.value;
        // this.show = this._settings.scene.show.value;
        // FIXME
        //this.showSceneTransition = +this._settings.scene.showSceneTransition.value.replace('s', '') * 1000;
    }

    private init() {
        let bb = this._sceneTree.boundingBox;
        let sceneExtents = vec3.distance(bb.min, bb.max);

        /**
         * TODO evaluate this magic
         * 
         * magic begin
         */

        let divisions = 0.1;
        let gridExtents = sceneExtents;
        if (sceneExtents > 1) {
            let tmp = Math.floor(sceneExtents).toString();
            let temp = Math.pow(10, tmp.length - 1);
            gridExtents = Math.max(Math.ceil(sceneExtents / temp) * temp, 1);
            temp = temp / 10;
            divisions = gridExtents / temp;
        }
        else {
            let zeros = 1 - Math.floor(Math.log(sceneExtents) / Math.log(10)) - 2;
            let r = sceneExtents.toFixed(zeros + 1);
            let firstDigit = parseInt(r.substr(r.length - 1)) + 1;
            let gridExtentsS = '0.';
            for (let i = 0; i < zeros; ++i)
                gridExtentsS = gridExtentsS + '0';
            gridExtents = parseFloat(gridExtentsS + firstDigit);
            divisions = firstDigit * 10;
        }

        /**
         * magic end
         */

        const gridObject = new SDObject('grid', '');
        this._grid = new THREE.GridHelper(2 * gridExtents, divisions);
        (<THREE.Material>this._grid.material).opacity = 0.15;
        (<THREE.Material>this._grid.material).transparent = true;
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this.gridVisibility;
        gridObject.add(this._grid);
        this._sceneTree.scene.add(gridObject);

        const groundPlaneObject = new SDObject('grid', '');
        let mat = new MaterialData();
        mat.color = vec4.fromValues(0.8274, 0.8274, 0.8274, 1);
        mat.side = MATERIAL_SIDE.FRONT;
        mat.roughness = 1;
        mat.metalness = 0;
        this._groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2), this._materialLoader.load(mat));
        this._groundPlane.receiveShadow = true;
        this._groundPlane.visible = this.groundPlaneVisibility;
        groundPlaneObject.add(this._groundPlane);
        this._sceneTree.scene.add(groundPlaneObject);

        let eps = 0.005;
        let bs = bb.boundingSphere;
        this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
    }

    // #endregion Private Methods (2)
}