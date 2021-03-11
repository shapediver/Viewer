import { vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { CameraEngine, CAMERATYPE, ICamera as Camera, ICameraEngine, PerspectiveCamera } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas, CanvasEngine } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Tree } from '@shapediver/viewer.shared.node-tree';

import { SceneTree } from './SceneTree';
import { ILightEngine, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { StateEngine, SettingsEngine, DomEventEngine } from '@shapediver/viewer.shared.services';
import { Converter } from '@shapediver/viewer.shared.utils';
import { SDObject } from './SDObject';
import { MaterialData, MATERIAL_SIDE } from '@shapediver/viewer.shared.types';

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (33)

    private readonly _cameraEngine;
    private readonly _canvasEngine: CanvasEngine;
    private readonly _converter = <Converter>container.resolve(Converter);
    private readonly _domEventEngine: DomEventEngine;
    private readonly _lightEngine;
    private readonly _orthographicCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _settings = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);

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
    private _lastTime: number = 0;
    private _lightHelper: boolean = false;
    private _lightScene: string = 'default';
    private _pointSize: number = 1.0;
    private _sceneTree!: SceneTree;
    private _shadows: boolean = true;
    private _show: boolean = false;
    private _showSceneTransition: number = 1000;

    // #endregion Properties (33)

    // #region Constructors (1)

    constructor(private readonly _id: string, canvasDefinition?: string | HTMLCanvasElement) {
        this._canvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
        this._canvas = this._canvasEngine.createCanvasObject(canvasDefinition);

        this._domEventEngine = new DomEventEngine(this._canvas.canvasElement);

        this._lightEngine = new LightEngine();
        this._cameraEngine = new CameraEngine(this._canvas, this._domEventEngine);

        this._stateEngine.settingsRegistered.then(() => this.init());
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

    public updateSceneTree(): void {
        if (this._stateEngine.settingsRegistered.resolved !== true) return;
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
    }

    // #endregion Public Methods (1)

    // #region Private Methods (2)

    private adjustCamera(time: number): THREE.Camera {
        let camera: THREE.Camera;
        const cameraDefinition = this._cameraEngine.getCamera().update(time);
        if (this._cameraEngine.getCamera().type === CAMERATYPE.ORTHOGRAPHIC) {
            const aspect = this._canvas.canvasElement.width / this.canvas.canvasElement.height;
            const distance = vec3.distance(cameraDefinition.position, cameraDefinition.target) / 2;
            this._orthographicCamera.up.set(0, 0, 1);
            this._orthographicCamera.left = -distance * aspect;
            this._orthographicCamera.bottom = -distance;
            this._orthographicCamera.right = distance * aspect;
            this._orthographicCamera.top = distance;
            this._orthographicCamera.near = 0.01 * distance;
            this._orthographicCamera.far = 10000 * distance;
            this._orthographicCamera.updateProjectionMatrix();
            camera = this._orthographicCamera;
        } else {
            this._perspectiveCamera.up.set(0, 0, 1);
            this._perspectiveCamera.fov = (<PerspectiveCamera>this._cameraEngine.getCamera()).fov;
            this._perspectiveCamera.aspect = this._canvas.canvasElement.width / this.canvas.canvasElement.height;
            this._perspectiveCamera.near = 0.01;
            this._perspectiveCamera.far = 10000;
            this._perspectiveCamera.updateProjectionMatrix();
            camera = this._perspectiveCamera;
        }
        camera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
        camera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2]);
        return camera;
    }

    private init() {
        this._sceneTree = new SceneTree();

        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

        (<SceneTree>this._sceneTree).scene.background = new THREE.Color(0xffffff)

        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas.canvasElement,
            antialias: true,
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);
        renderer.setClearColor(new THREE.Color(0xffffff))

        this._stateEngine.boundingBoxCreated.then(() => {
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
            let groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2), this._sceneTree.createMaterial(mat));
            groundPlane.receiveShadow = true;
            groundPlane.visible = this._settings.scene.groundPlaneVisibility.value;
            groundPlaneObject.add(groundPlane);
            this._sceneTree.scene.add(groundPlaneObject);

            let eps = 0.005;
            let bs = bb.boundingSphere;
            grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
            groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        });

        const animate = (time: number) => {
            requestAnimationFrame(animate);
            let deltaTime = time - this._lastTime;
            deltaTime = deltaTime < 0 ? 0 : deltaTime;
            this._lastTime = time;
            try {
                this._cameraEngine.getCamera();
                const camera = this.adjustCamera(deltaTime);
                renderer.setSize(this.canvas.canvasElement.width, this.canvas.canvasElement.height);
                renderer.render((<SceneTree>this._sceneTree).scene, camera);
            } catch (e) { console.log(e) }
        };
        animate(0);
    }

    // #endregion Private Methods (2)
}