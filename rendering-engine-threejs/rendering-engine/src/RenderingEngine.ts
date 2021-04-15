import { vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { CameraEngine, CAMERATYPE, ICameraEngine, OrthographicCameraControls, PerspectiveCamera, PerspectiveCameraControls } from '@shapediver/viewer.rendering-engine.camera-engine';
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
    private readonly _canvasEngine: CanvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _domEventEngine: DomEventEngine;
    private readonly _environmentMapLoader: EnvironmentMapLoader;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _geometryLoader: GeometryLoader;
    private readonly _id: string;
    private readonly _lightEngine: LightEngine;
    private readonly _lightLoader: LightLoader;
    private readonly _materialLoader: MaterialLoader;
    private readonly _renderingLogic: RenderingLogic;
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);
    private readonly _visibility: VISIBILITYMODE;

    private _ambientOcclusion: boolean = true;
    private _beautyRenderBlendingDuration: number = 1500;
    private _beautyRenderDelay: number = 50;
    private _blurSceneWhenBusy: boolean = true;
    private _canvas!: Canvas;
    private _clearAlpha: number = 1.0;
    private _clearColor: vec3 = vec3.fromValues(1,1,1);
    private _environmentMap: string | string[] = 'none';
    private _environmentMapAsBackground: boolean = false;
    private _environmentMapResolution: string = '1024';
    private _grid!: THREE.GridHelper;
    private _gridVisibility: boolean = true;
    private _groundPlane!: THREE.Mesh;
    private _groundPlaneVisibility: boolean = true;
    private _lightScene: string = 'default';
    private _logoDivElement: HTMLDivElement;
    private _pointSize: number = 1.0;
    private _sceneTree!: SceneTree;
    private _shadows: boolean = true;
    private _show: boolean = false;

    // #endregion Properties (39)

    // #region Constructors (1)

    constructor(properties: { id: string, canvas?: string | HTMLCanvasElement, visibility: VISIBILITYMODE }) {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
        this._id = properties.id;
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
        
        this._stateEngine.createCustomState(this.id + '_settings_loaded');

        if(this._visibility === VISIBILITYMODE.INSTANT) this.show = true;

        if(this._visibility === VISIBILITYMODE.SESSION) {
            this._stateEngine.firstSessionLoaded.then(() => {
                // check if there are settings
                if(this._stateEngine.firstSettingsRegistered.resolved === false) {
                    this.show = true;
                } else {
                    // wait for settings to load before showing the scene
                    this._stateEngine.getCustomState(this.id + '_settings_loaded').then(() => {
                        this.show = true;
                    })
                }
            })
        }

        this._stateEngine.boundingBoxCreated.then(() => this.init());
        this._stateEngine.firstSettingsRegistered.then(() => this.applySettings());
    }

    // #endregion Constructors (1)

    // #region Public Accessors (46)

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

    // #endregion Public Accessors (46)

    // #region Public Methods (2)

    public getScreenshot(type?: string, encoderOptions?: number): string {
        return this._renderingLogic.getScreenshot(type, encoderOptions);
    }

    public update(): void {
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
        this._renderingLogic.render();
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    private applySettings() {
        // as the environment map is the only thing that needs time to load, load it first
        this._eventEngine.addListener(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, (e: any) => {
            // return if a different env map was loaded
            if(!e.name || (e.name && e.name !== this._settingsEngine.scene.material.environmentMap.value)) return;

            this.environmentMapAsBackground = this._settingsEngine.scene.material.environmentMapAsBackground.value;
            // TODO
            this.ambientOcclusion = this._settingsEngine.scene.render.ambientOcclusion.value;
            this.beautyRenderBlendingDuration = this._settingsEngine.scene.render.beautyRenderBlendingDuration.value;
            this.beautyRenderDelay = this._settingsEngine.scene.render.beautyRenderDelay.value;
            // TODO
            this.blurSceneWhenBusy = this._settingsEngine.general.viewer.blurSceneWhenBusy.value;
            this.clearAlpha = this._settingsEngine.scene.render.clearAlpha.value;
            const c = this._converter.toColor(this._settingsEngine.scene.render.clearColor.value);
            this.clearColor = vec3.fromValues(c[0], c[1], c[2]);
            this.gridVisibility = this._settingsEngine.scene.gridVisibility.value;
            this.groundPlaneVisibility = this._settingsEngine.scene.groundPlaneVisibility.value;
            this.lightScene = this._settingsEngine.scene.lights.lightScene.value;
            // TODO
            this.pointSize = this._settingsEngine.rendering.pointSize.value;
            this.shadows = this._settingsEngine.scene.render.shadows.value;
            // FIXME
            //this.showSceneTransition = +this._settingsEngine.scene.showSceneTransition.value.replace('s', '') * 1000;

            this._stateEngine.getCustomState(this.id + '_settings_loaded').resolve(true);
        })
        // set it like this to not trigger the loading
        this._environmentMapResolution = this._settingsEngine.scene.material.environmentMapResolution.value;
        this.environmentMap = this._settingsEngine.scene.material.environmentMap.value;
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


    public saveSettings() {
        this._settingsEngine.general.viewer.blurSceneWhenBusy.value = this.blurSceneWhenBusy;
        // FIXME
        // this._settingsEngine.scene.showSceneTransition.value = (this.showSceneTransition / 1000) + 's';
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
        this._settingsEngine.scene.render.clearColor.value = this.clearColor.toString();
        this._settingsEngine.scene.render.pointSize.value = this.pointSize;
        this._settingsEngine.scene.render.shadows.value = this.shadows;


        const camera = this.cameraEngine.getCamera();
        if(camera) {
            this._settingsEngine.scene.camera.autoAdjust.value = camera.autoAdjust;
            this._settingsEngine.scene.camera.cameraMovementDuration.value = camera.cameraMovementDuration;
            this._settingsEngine.scene.camera.enableCameraControls.value = camera.enableCameraControls;
            this._settingsEngine.scene.camera.revertAtMouseUp.value = camera.revertAtMouseUp;
            this._settingsEngine.scene.camera.revertAtMouseUpDuration.value = camera.revertAtMouseUpDuration;
            this._settingsEngine.scene.camera.zoomExtentsFactor.value = camera.zoomExtentsFactor;
            
            if(camera.type === CAMERATYPE.PERSPECTIVE) {
                this._settingsEngine.scene.camera.cameraTypes.active.value = 0;
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.position = camera.defaultPosition;
                this._settingsEngine.scene.camera.cameraTypes.perspective.default.value.target = camera.defaultTarget;
                this._settingsEngine.scene.camera.cameraTypes.perspective.fov.value = (<PerspectiveCamera>camera).fov;

                const controls = <PerspectiveCameraControls>camera.controls;
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

                this._settingsEngine.scene.camera.controls.orbit.restrictions.position.cube.value = controls.cubePositionRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.position.sphere.value = controls.spherePositionRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.target.cube.value = controls.cubePositionRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.target.sphere.value = controls.spherePositionRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.rotation.value = controls.rotationRestriction;
                this._settingsEngine.scene.camera.controls.orbit.restrictions.zoom.value = controls.zoomRestriction;

            } else {
                // TODO
                this._settingsEngine.scene.camera.cameraTypes.active.value = 1;
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position = camera.defaultPosition;
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target = camera.defaultTarget;
                
                const controls = <OrthographicCameraControls>camera.controls;
                this._settingsEngine.scene.camera.controls.orbit.damping.value = controls.damping;
                this._settingsEngine.scene.camera.controls.orbit.enableKeyPan.value = controls.enableKeyPan;
                this._settingsEngine.scene.camera.controls.orbit.enablePan.value = controls.enablePan;
                this._settingsEngine.scene.camera.controls.orbit.enableZoom.value = controls.enableZoom;
                this._settingsEngine.scene.camera.controls.orbit.input.value = controls.input;
                this._settingsEngine.scene.camera.controls.orbit.keyPanSpeed.value = controls.keyPanSpeed;
                this._settingsEngine.scene.camera.controls.orbit.movementSmoothness.value = controls.movementSmoothness;
                this._settingsEngine.scene.camera.controls.orbit.panSpeed.value = controls.panSpeed;
                this._settingsEngine.scene.camera.controls.orbit.zoomSpeed.value = controls.zoomSpeed;
            }
        }
    }

    // #endregion Private Methods (2)
}