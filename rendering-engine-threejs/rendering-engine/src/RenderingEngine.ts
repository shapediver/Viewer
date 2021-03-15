import { vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { CameraEngine, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.shared.node-tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { StateEngine, SettingsEngine, DomEventEngine } from '@shapediver/viewer.shared.services';
import { SDObject } from './types/SDObject';
import { MaterialData, MATERIAL_SIDE } from '@shapediver/viewer.shared.types';
import { RenderingLogic } from './RenderingLogic';
import { MaterialLoader } from './loaders/MaterialLoader';

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (31)

    private readonly _cameraEngine: CameraEngine;
    private readonly _canvasEngine: CanvasEngine;
    private readonly _domEventEngine: DomEventEngine;
    private readonly _lightEngine: LightEngine;
    private readonly _materialLoader: MaterialLoader;
    private readonly _renderingLogic: RenderingLogic;
    private readonly _settings: SettingsEngine;
    private readonly _stateEngine: StateEngine;
    private readonly _tree: Tree;

    private _ambientOcclusion: boolean = true;
    private _beautyRenderDelay: number = 50;
    private _blurSceneWhenBusy: boolean = true;
    private _canvas!: Canvas;
    private _clearAlpha: number = 1.0;
    private _clearColor: string = '#ffffff';
    private _duration: number = 0;
    private _environmentMap: string = 'none';
    private _environmentMapAsBackground: boolean = false;
    private _environmentMapResolution: string = '1024';
    private _fullscreen: boolean = false;
    private _gridVisibility: boolean = true;
    private _groundPlaneReflectionThreshold: number = 0.01;
    private _groundPlaneReflectionVisibility: boolean = false;
    private _groundPlaneVisibility: boolean = true;
    private _lightHelper: boolean = false;
    private _lightScene: string = 'default';
    private _pointSize: number = 1.0;
    private _sceneTree!: SceneTree;
    private _shadows: boolean = true;
    private _show: boolean = false;
    private _showSceneTransition: number = 1000;

    // #endregion Properties (31)

    // #region Constructors (1)

    constructor(private readonly _id: string, canvasDefinition?: string | HTMLCanvasElement) {
        this._settings = <SettingsEngine>container.resolve(SettingsEngine);
        this._stateEngine = <StateEngine>container.resolve(StateEngine);
        this._tree = <Tree>container.resolve(Tree);
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(canvasDefinition);

        this._domEventEngine = new DomEventEngine(this._canvas.canvasElement);
        this._materialLoader = new MaterialLoader();

        this._lightEngine = new LightEngine();
        this._cameraEngine = new CameraEngine(this._canvas, this._domEventEngine);

        this._sceneTree = new SceneTree();
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

        (<SceneTree>this._sceneTree).scene.background = new THREE.Color(0xffffff);

        this._renderingLogic = new RenderingLogic(this);

        this._stateEngine.boundingBoxCreated.then(() => this.init());
    }

    // #endregion Constructors (1)

    // #region Public Accessors (44)

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
     * @return {string}
     */
    public get environmentMap(): string {
        return this._environmentMap;
    }

    /**
     * Setter environmentMap
     * @param {string} value
     */
    public set environmentMap(value: string) {
        this._environmentMap = value;
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
        this._gridVisibility = value;
    }

    /**
     * Getter groundPlaneReflectionThreshold
     * @return {number}
     */
    public get groundPlaneReflectionThreshold(): number {
        return this._groundPlaneReflectionThreshold;
    }

    /**
     * Setter groundPlaneReflectionThreshold
     * @param {number} value
     */
    public set groundPlaneReflectionThreshold(value: number) {
        this._groundPlaneReflectionThreshold = value;
    }

    /**
     * Getter groundPlaneReflectionVisibility
     * @return {boolean}
     */
    public get groundPlaneReflectionVisibility(): boolean {
        return this._groundPlaneReflectionVisibility;
    }

    /**
     * Setter groundPlaneReflectionVisibility
     * @param {boolean} value
     */
    public set groundPlaneReflectionVisibility(value: boolean) {
        this._groundPlaneReflectionVisibility = value;
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

    /**
     * Getter showSceneTransition
     * @return {number}
     */
    public get showSceneTransition(): number {
        return this._showSceneTransition;
    }

    /**
     * Setter showSceneTransition
     * @param {number} value
     */
    public set showSceneTransition(value: number) {
        this._showSceneTransition = value;
    }

    // #endregion Public Accessors (44)

    // #region Public Methods (1)

    public update(): void {
        if (this._stateEngine.settingsRegistered.resolved !== true) return;
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

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
        let grid = new THREE.GridHelper(2 * gridExtents, divisions);
        (<THREE.Material>grid.material).opacity = 0.15;
        (<THREE.Material>grid.material).transparent = true;
        grid.rotateX(Math.PI / 2);
        grid.visible = this._settings.scene.gridVisibility.value;
        gridObject.add(grid);
        this._sceneTree.scene.add(gridObject);

        const groundPlaneObject = new SDObject('grid', '');
        let mat = new MaterialData();
        mat.color = vec4.fromValues(0.8274, 0.8274, 0.8274, 1);
        mat.side = MATERIAL_SIDE.FRONT;
        mat.roughness = 1;
        mat.metalness = 0;
        let groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2), this._materialLoader.load(mat));
        groundPlane.receiveShadow = true;
        groundPlane.visible = this._settings.scene.groundPlaneVisibility.value;
        groundPlaneObject.add(groundPlane);
        this._sceneTree.scene.add(groundPlaneObject);

        let eps = 0.005;
        let bs = bb.boundingSphere;
        grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
    }

    // #endregion Private Methods (1)
}