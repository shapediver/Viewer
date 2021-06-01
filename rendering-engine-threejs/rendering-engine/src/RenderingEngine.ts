import { vec2, vec3, vec4 } from 'gl-matrix';
import * as THREE from 'three';
import { container } from 'tsyringe'

import { AbstractCamera, CameraEngine, CAMERATYPE, ICameraEngine, OrthographicCameraControls, PerspectiveCamera, PerspectiveCameraControls } from '@shapediver/viewer.rendering-engine.camera-engine';
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
import { HTMLElementAnchorLoader } from './loaders/HTMLElementAnchorLoader';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { GeometryData } from '@shapediver/viewer.shared.types';
import { Box } from '@shapediver/viewer.shared.math';

export class RenderingEngine implements IRenderingEngine {
    // #region Properties (41)

    private readonly _cameraEngine: CameraEngine;
    private readonly _canvasEngine: CanvasEngine = <CanvasEngine>container.resolve(CanvasEngine);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _domEventEngine: DomEventEngine;
    private readonly _environmentMapLoader: EnvironmentMapLoader;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _geometryLoader: GeometryLoader;
    private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
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
    private _automaticResizing: boolean = true;
    private _beautyRenderBlendingDuration: number = 1500;
    private _beautyRenderDelay: number = 50;
    private _blurSceneWhenBusy: boolean = true;
    private _canvas!: Canvas;
    private _clearAlpha: number = 1.0;
    private _clearColor: string = '#ffffff';
    private _closed: boolean = false;
    private _environmentMap: string | string[] = 'none';
    private _environmentMapAsBackground: boolean = false;
    private _environmentMapResolution: string = '1024';
    private _grid!: THREE.GridHelper;
    private _gridObject!: SDObject;
    private _gridVisibility: boolean = true;
    private _groundPlane!: THREE.Mesh;
    private _groundPlaneObject!: SDObject;
    private _groundPlaneVisibility: boolean = true;
    private _lightScene: string = 'default';
    private _logoDivElement: HTMLDivElement;
    private _pointSize: number = 1.0;
    private _sceneTree!: SceneTree;
    private _shadows: boolean = true;
    private _show: boolean = false;

    // #endregion Properties (41)

    // #region Constructors (1)

    constructor(properties: { id: string, canvas?: string | HTMLCanvasElement, visibility: VISIBILITYMODE }) {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
        this._id = properties.id;
        this._canvas = this._canvasEngine.createCanvasObject(properties.canvas);
        this._environmentMapLoader = new EnvironmentMapLoader(this);
        this._materialLoader = new MaterialLoader(this);
        this._geometryLoader = new GeometryLoader(this);
        this._htmlElementAnchorLoader = new HTMLElementAnchorLoader(this);
        this._lightLoader = new LightLoader(this);
        this._visibility = properties.visibility;

        this._logoDivElement = document.createElement('div');
        this._logoDivElement.style.background = '#030531';
        this._logoDivElement.style.position = 'relative';
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

        (<SceneTree>this._sceneTree).scene.background = new THREE.Color('#ffffff');

        this._renderingLogic = new RenderingLogic(this);

        this._gridObject = new SDObject('grid', '');
        this._grid = new THREE.GridHelper();
        (<THREE.Material>this._grid.material).opacity = 0.15;
        (<THREE.Material>this._grid.material).transparent = true;
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this.gridVisibility;
        this._gridObject.add(this._grid);
        this._sceneTree.scene.add(this._gridObject);

        this._groundPlaneObject = new SDObject('grid', '');
        let mat = new MaterialData();
        mat.color = '#d3d3d3';
        mat.side = MATERIAL_SIDE.FRONT;
        mat.roughness = 1;
        mat.metalness = 0;
        this._groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(), this._materialLoader.load(mat));
        this._groundPlane.receiveShadow = true;
        this._groundPlane.visible = this.groundPlaneVisibility;
        this._groundPlaneObject.add(this._groundPlane);
        this._sceneTree.scene.add(this._groundPlaneObject);

        let eps = 0.005;
        this._grid.position.set(0, 0, -eps);
        this._groundPlane.position.set(0, 0, -eps);

        this._stateEngine.createCustomState(this.id + '_settings_loaded');

        if (this._visibility === VISIBILITYMODE.INSTANT) this.show = true;

        if (this._visibility === VISIBILITYMODE.SESSION) {
            this._stateEngine.primarySessionLoaded.then(() => {
                // wait for settings to load before showing the scene
                this._stateEngine.getCustomState(this.id + '_settings_loaded').then(() => {
                    this.changeSceneExtents(this._sceneTree.boundingBox);
                    this.show = true;
                })
            })
        }
        if(this._stateEngine.primarySettingsRegistered.resolved) {
            this._stateEngine.primarySettingsRegistered.then(() => setTimeout(() => this.applySettings(), 0));
        } else {
            this._stateEngine.primarySettingsRegistered.then(() => this.applySettings());
        }
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
     * Getter closed
     * @return {boolean}
     */
    public get closed(): boolean {
        return this._closed;
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
        if (this._grid) this._grid.visible = value;
        this._gridVisibility = value;
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
        if (this._groundPlane) this._groundPlane.visible = value;
        this._groundPlaneVisibility = value;
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
     * Getter minimalRendering
     * @return {boolean}
     */
     public get minimalRendering(): boolean {
        return this._renderingLogic.minimalRendering;
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

    // #endregion Public Accessors (44)

    // #region Public Methods (9)

    public changeSceneExtents(bb: Box) {
        if (vec3.equals(bb.min, vec3.create()) && vec3.equals(bb.max, vec3.create()))
            bb = new Box(vec3.fromValues(-10, -10, -10), vec3.fromValues(10, 10, 10));

        let sceneExtents = vec3.distance(bb.min, bb.max);

        /**
         * https://shapediver.atlassian.net/browse/SS-2961 evaluate this magic
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
        this._gridObject.remove(this._grid);
        this._grid = new THREE.GridHelper(2 * gridExtents, divisions);
        (<THREE.Material>this._grid.material).opacity = 0.15;
        (<THREE.Material>this._grid.material).transparent = true;
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this.gridVisibility;
        this._gridObject.add(this._grid);

        this._groundPlane.geometry = new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2);

        let eps = 0.005;
        let bs = bb.boundingSphere;
        this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
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

    public convert3Dto2D(p: vec3): {
        container: vec2, client: vec2, page: vec2, hidden: boolean
    } {
        const canvasPageCoordinates = this.canvas.canvasElement.getBoundingClientRect(),
            width = this.canvas.canvasElement.width,
            height = this.canvas.canvasElement.height;

        const camera = this.cameraEngine.getCamera();
        if (!camera) throw new Error('No camera is defined for this viewer.');

        const direction = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p, camera.position));
        const tracing = this.trace(camera.position, direction);
        const pos: vec2 = (<AbstractCamera>camera).project(vec3.clone(p));

        pos[0] = (pos[0] * (width / 2)) + (width / 2);
        pos[1] = - (pos[1] * (height / 2)) + (height / 2);

        // take care of correction by device pixel ratio
        pos[0] = pos[0] / devicePixelRatio;
        pos[1] = pos[1] / devicePixelRatio;

        return {
            hidden: tracing.length > 1 && tracing[0].distance > 0 && tracing[0].distance < Infinity && tracing[0].distance < vec3.distance(camera.position, p),
            container: vec2.clone(pos),
            client: vec2.fromValues(pos[0] + canvasPageCoordinates.left, pos[1] + canvasPageCoordinates.top),
            page: vec2.fromValues(pos[0] + canvasPageCoordinates.left + window.pageXOffset, pos[1] + canvasPageCoordinates.top + window.pageYOffset)
        };
    }

    public getScreenshot(type?: string, encoderOptions?: number): string {
        return this._renderingLogic.getScreenshot(type, encoderOptions);
    }

    public reset() {
        this.changeSceneExtents(this._sceneTree.boundingBox)
        if(this._visibility === VISIBILITYMODE.SESSION) this.show = false;
        this._stateEngine.getCustomState(this.id + '_settings_loaded').reset();
    }

    public resize(width: number, height: number): void {
        this._renderingLogic.resize(width, height);
        this._renderingLogic.render();
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
                // https://shapediver.atlassian.net/browse/SS-2948
                this._settingsEngine.scene.camera.cameraTypes.active.value = 1;

                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.position = { x: camera.defaultPosition[0], y: camera.defaultPosition[1], z: camera.defaultPosition[2] };
                this._settingsEngine.scene.camera.cameraTypes.orthographic.default.value.target = { x: camera.defaultTarget[0], y: camera.defaultTarget[1], z: camera.defaultTarget[2] };

                const controls = <OrthographicCameraControls>camera.controls;
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

    public trace(origin: vec3, direction: vec3, root: TreeNode = this._tree.root) {
        const tracingData: { distance: number, data: GeometryData }[] = [];
        const trace = (root: TreeNode) => {
            for (let i = 0; i < root.data.length; i++)
                if (root.data[i] instanceof GeometryData) {
                    const distance = (<GeometryData>root.data[i]).boundingBox.intersect(origin, direction);
                    if (distance) tracingData.push({ distance, data: <GeometryData>root.data[i] })
                }
            for (let i = 0; i < root.children.length; i++)
                trace(root.children[i]);
        }
        trace(root);

        tracingData.sort((a: { distance: number, data: GeometryData }, b: { distance: number, data: GeometryData }) => {
            return a.distance - b.distance;
        })

        return tracingData;
    }

    public update(): void {
        this._sceneTree.updateSceneTree(this._tree.root, <LightEngine>this._lightEngine);
        this._renderingLogic.render();
    }

    // #endregion Public Methods (9)

    // #region Private Methods (1)

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
            this.update();
        })

        // set it like this to not trigger the loading
        this._environmentMapResolution = this._settingsEngine.scene.material.environmentMapResolution.value;
        this.environmentMap = this._settingsEngine.scene.material.environmentMap.value;
    }

    // #endregion Private Methods (1)
}