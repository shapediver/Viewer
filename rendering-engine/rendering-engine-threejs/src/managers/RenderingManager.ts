import * as Stats from 'stats.js';
import * as THREE from 'three';
import { AnimationEngine } from '@shapediver/viewer.rendering-engine.animation-engine';
import { AnimationFrameEngine } from '@shapediver/viewer.rendering-engine.animation-frame-engine';
import {
    IManager
} from '@shapediver/viewer.rendering-engine.rendering-engine';
import { BUSY_MODE_DISPLAY, ICameraEvent, IViewportEvent, RENDERER_TYPE, SPINNER_POSITIONING } from '@shapediver/viewer.shared.types';
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree';
import { RenderingEngine } from '../RenderingEngine';
import { SceneTreeManager } from './SceneTreeManager';
import {
    CAMERA_TYPE,
    PerspectiveCamera,
    PerspectiveCameraControls,
} from '@shapediver/viewer.rendering-engine.camera-engine';
import {
    Converter,
    EventEngine,
    EVENTTYPE,
    EVENTTYPE_VIEWPORT,
    Logger,
    SystemInfo,
} from '@shapediver/viewer.shared.services';

export class RenderingManager implements IManager {
    // #region Properties (30)

    private readonly _animationEngine: AnimationEngine = AnimationEngine.instance;
    private readonly _animationFrameEngine: AnimationFrameEngine = AnimationFrameEngine.instance;
    private readonly _converter: Converter = Converter.instance;
    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _logger: Logger = Logger.instance;
    private readonly _systemInfo: SystemInfo = SystemInfo.instance;
    private readonly _tree: ITree = Tree.instance;

    private _activeRendering: boolean = true;
    private _cameraChanged: boolean = false;
    private _continuousRendering: boolean = false;
    private _continuousShadowMapUpdate: boolean = false;
    private _height: number = 0;
    private _hidden: boolean = true;
    private _hiddenCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    private _hiddenRenderTarget: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget();
    private _hideLogo: boolean = false;
    private _lastSize: {
        adjustedWidth: number,
        adjustedHeight: number,
        width: number,
        height: number
    } = {
            adjustedWidth: 0,
            adjustedHeight: 0,
            width: 0,
            height: 0
        };
    private _lightSizeUVEnd = 0.15;
    private _lightSizeUVStart = 0.025;
    private _maxTextureUnits: number = 0;
    private _minimalRendering: boolean = false;
    private _noWebGL: boolean = false;
    private _runningAnimation: boolean = false;
    private _sizeChanged: boolean = false;
    private _softShadowRenderingActive: boolean = false;
    private _softShadowRenderingDurationActive: number = 0;
    private _softShadowRenderingTimeout: NodeJS.Timeout | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _stats: any;
    private _usingSwiftShader: boolean = false;
    private _width: number = 0;

    // #endregion Properties (30)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get continuousRendering(): boolean {
        return this._continuousRendering;
    }

    public set continuousRendering(value: boolean) {
        this._continuousRendering = value;
    }

    public get continuousShadowMapUpdate(): boolean {
        return this._continuousShadowMapUpdate;
    }

    public set continuousShadowMapUpdate(value: boolean) {
        this._continuousShadowMapUpdate = value;
    }

    public get minimalRendering(): boolean {
        return this._minimalRendering;
    }

    public get usingSwiftShader(): boolean {
        return this._usingSwiftShader;
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (10)

    public addLogo(canvas: HTMLCanvasElement, branding: {
        logo: string | null;
        backgroundColor: string;
        busyModeSpinner: string;
        busyModeDisplay: BUSY_MODE_DISPLAY;
        spinnerPositioning: SPINNER_POSITIONING
    }): HTMLDivElement {
        const logoDivElement = document.createElement('div');
        logoDivElement.style.backgroundColor = branding.backgroundColor;
        logoDivElement.classList.add('sdv-logo-container');
        canvas.parentElement?.insertBefore(logoDivElement, canvas.parentElement?.firstChild);

        if (branding.logo) {
            const img = new Image();
            img.classList.add('sdv-logo');
            img.src = branding.logo;
            logoDivElement.appendChild(img);
        }

        return logoDivElement;
    }

    public addSpinner(canvas: HTMLCanvasElement, branding: {
        logo: string | null;
        backgroundColor: string;
        busyModeSpinner: string;
        busyModeDisplay: BUSY_MODE_DISPLAY;
        spinnerPositioning: SPINNER_POSITIONING
    }): HTMLDivElement {
        const spinnerDivElement = document.createElement('div');
        spinnerDivElement.classList.add('sdv-spinner-container');

        spinnerDivElement.style.visibility = 'hidden';
        canvas.parentElement?.insertBefore(spinnerDivElement, canvas.parentElement?.firstChild);

        if (branding.busyModeSpinner) {
            const img = new Image();
            img.src = branding.busyModeSpinner;
            img.classList.add('sdv-spinner');
            img.classList.add('sdv-spinner-' + branding.spinnerPositioning.replace('_', '-').toLowerCase());
            spinnerDivElement.appendChild(img);
        }

        return spinnerDivElement;
    }

    public createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
        const renderingProperties = {
            alpha: true,
            depth: true,
            antialias: true,
            preserveDrawingBuffer: true,
            stencil: true,
            premultipliedAlpha: true,
            canvas
        };
        const renderer = new THREE.WebGLRenderer(renderingProperties);
        renderer.setPixelRatio(window.devicePixelRatio);

        const context = renderer.getContext();

        if (renderer.extensions.has('WEBGL_debug_renderer_info')) {
            const debugInfo = renderer.extensions.get('WEBGL_debug_renderer_info');
            // const vendor = context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const rendererInfo = context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (rendererInfo === 'Google SwiftShader') {
                this._usingSwiftShader = true;
                this._logger.warn('RenderingLogic.createWebGLContext: The current device is using Google SwiftShader, a CPU-based renderer. To achieve better rendering results, please enable GPU-rendering in your settings.');
            }
        }

        if (!renderer.extensions.has('EXT_shader_texture_lod'))
            this._minimalRendering = true;

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.localClippingEnabled = true;
        renderer.setSize(canvas.width, canvas.height);
        renderer.setClearColor(new THREE.Color('#ffffff'), 1);
        this._maxTextureUnits = renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_IMAGE_UNITS);
        return renderer;
    }

    public evaluateTextureUnitCount(value: number) {
        if (value > this._maxTextureUnits) {
            this._logger.warn('RenderingManager.evaluateTextureUnitCount: Maximum number of texture units exceeded. Disabling shadows.');
            this._renderingEngine.lightLoader.forceDisabledShadows = true;
            this._renderingEngine.update('RenderingManager.evaluateTextureUnitCount');
        } else {
            this._renderingEngine.lightLoader.forceDisabledShadows = false;
        }
    }

    public getScreenshot(type: string = 'image/png', encoderOptions: number = 1): string {
        return this._renderingEngine.renderer.domElement.toDataURL(type, encoderOptions);
    }

    public init(): void {
        try {
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVEnd, 1.0);

            this._renderingEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
            this._renderingEngine.renderer.shadowMap.needsUpdate = true;
            this._renderingEngine.materialLoader.updateMaterials();

            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => {
                const viewerEvent = <ICameraEvent>e;
                if (viewerEvent.viewportId === this._renderingEngine.id)
                    this.startRendering();
            });
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
                const viewerEvent = <ICameraEvent>e;
                if (viewerEvent.viewportId === this._renderingEngine.id)
                    this.stopRendering();
            });

            window.onresize = () => { this.render(); };
            this._renderingEngine.canvas.onresize = () => { this.render(); };
            this._renderingEngine.canvas.parentElement!.onresize = () => { this.render(); };

            const stats1 = new Stats.default();
            stats1.showPanel(0); // Panel 0 = fps
            stats1.dom.style.cssText = 'position:absolute;top:0px;left:0px;display:none;';
            this._renderingEngine.canvas.parentElement!.appendChild(stats1.dom);

            const stats2 = new Stats.default();
            stats2.showPanel(1); // Panel 1 = ms
            stats2.dom.style.cssText = 'position:absolute;top:0px;left:80px;display:none;';
            this._renderingEngine.canvas.parentElement!.appendChild(stats2.dom);

            const stats3 = new Stats.default();
            stats3.showPanel(2); // Panel 2 = ms
            stats3.dom.style.cssText = 'position:absolute;top:0px;left:160px;display:none;';
            this._renderingEngine.canvas.parentElement!.appendChild(stats3.dom);

            this._stats = {
                stats: [stats1, stats2, stats3],
                begin: () => {
                    stats1.begin();
                    stats2.begin();
                    stats3.begin();
                },
                end: () => {
                    stats1.end();
                    stats2.end();
                    stats3.end();
                }
            };
        } catch (e) {
            this._noWebGL = true;
            throw e;
        }
    }

    public render() {
        this.startAndStopRendering();
    }

    public resize(width: number, height: number) {
        this._width = width, this._height = height;
        this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);
    }

    /**
     * Must only be called once by the RenderingEngine!
     */
    public start() {
        this._animationFrameEngine.addAnimationFrameCallback(this.animate.bind(this));
        this.startAndStopRendering();
    }

    public updateShadowMap() {
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
    }

    // #endregion Public Methods (10)

    // #region Private Methods (14)

    private activateBeautyRenderShaders() {
        this._renderingEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
        this._renderingEngine.materialLoader.updateMaterials();
    }

    private animate(time: number, deltaTime: number, runningAnimation: boolean): void {
        // animation loop - part 1: initial discarding
        if (this._renderingEngine.closed || this._noWebGL) return;

        this._renderingEngine.evaluateFlagState();

        // update if needed
        if (this._renderingEngine.show === true && this._tree.root.version !== this._renderingEngine.sceneTreeManager.lastRootVersion) {
            this._renderingEngine.sceneTreeManager.updateSceneTree(this._tree.root);
            this.updateShadowMap();
            this._animationEngine.updateAnimationData();
            this.render();
            this._eventEngine.emitEvent(EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED, <IViewportEvent>{ viewportId: this._renderingEngine.id });
        }

        if (this._renderingEngine.preRenderingCallback)
            this._renderingEngine.preRenderingCallback(this._renderingEngine.renderer);

        if (runningAnimation !== this._runningAnimation) this.render();
        this._runningAnimation = runningAnimation;
        if (this._runningAnimation) this._renderingEngine.sceneTreeManager.updateNode(undefined, undefined, { transformationOnly: true });
        if (this._runningAnimation) this._renderingEngine.sceneTreeManager.updateMorphWeights();

        // get the current size
        const { width, height, adjustedWidth, adjustedHeight } = this.calculateSize();
        const aspect = width / height;
        this._sizeChanged = this._lastSize.adjustedHeight !== adjustedHeight || this._lastSize.adjustedWidth !== adjustedWidth || this._lastSize.height !== height || this._lastSize.width !== width;
        this._lastSize = { width, height, adjustedWidth, adjustedHeight };

        // animation loop - part 3: update the camera, if there are new movements, they will start / continue the rendering
        this._cameraChanged = this._renderingEngine.cameraEngine.camera ? this._renderingEngine.cameraManager.updateCamera(deltaTime, aspect) : false;

        // animation loop - part 4: evaluating state
        const states = this.evaluateRenderingState();

        // toggle the blurring
        this.toggleBusyMode(states.busyMode);

        // animation loop - part 5: the scene is not even shown
        if (states.showScene === false) {
            // toggle on logo
            this.toggleLogo(true);

            if (this._hidden === false)
                this._eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_HIDDEN, { viewportId: this._renderingEngine.id });

            this._hidden = true;
            return;
        } else {
            // we delay for one render call as some of the postprocessing effects have artefacts in the first call
            if (this._hideLogo === true && this._hidden === true) {
                this.toggleLogo(false);
                this._hideLogo = false;

                if (this._hidden === true)
                    this._eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_VISIBLE, { viewportId: this._renderingEngine.id });

                this._hidden = false;
            } else {
                this._hideLogo = true;
                if (this._hidden === true)
                    this._renderingEngine.postProcessingManager.changeEffectPass();
            }
        }

        // animation loop - part 6: the scene is shown, but there is no active rendering happening
        if (states.rendering === false || this._renderingEngine.pause === true) return;

        // animation loop - part 7: there is actual rendering happening
        // do the things that have to be done for standard and beauty rendering in the same way
        this._stats.begin();
        this.showStatistics();

        // animation loop - part 8: calculate the current size
        const currentSize = new THREE.Vector2();
        this._renderingEngine.renderer.getSize(currentSize);
        if (!currentSize.equals(new THREE.Vector2(adjustedWidth, adjustedHeight))) {
            this._renderingEngine.renderer.setSize(adjustedWidth, adjustedHeight);
            this._renderingEngine.postProcessingManager.resize(adjustedWidth, adjustedHeight);
            this._renderingEngine.renderer.domElement.style.width = width + 'px';
            this._renderingEngine.renderer.domElement.style.height = height + 'px';
            this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);
        }

        // animation loop - part 9: adjust the camera (the rendering state would be false if we didn't have a camera)
        const { camera, matrix } = this._renderingEngine.cameraManager.adjustCamera(aspect);

        // if a matrix is provided after a camera adjustment
        // that means that the turntable controls or the object controls are activated
        if (matrix) {
            for (let i = 0; i < this._tree.root.children.length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!(<any>this._tree.root.children[i]).sessionNode || this._tree.root.children[i].excludeViewports.includes(this._renderingEngine.id)) continue;
                const transform = this._tree.root.children[i].transformations.find(t => t.id === 'objectRotation');
                if (transform) {
                    transform.matrix = matrix;
                } else {
                    this._tree.root.children[i].addTransformation({
                        id: 'objectRotation',
                        matrix
                    });
                }
            }
            states.updateShadowMap = true;
            this._renderingEngine.sceneTreeManager.updateNode(undefined, undefined, { transformationOnly: true });
        }

        // animation loop - part 10: adjust the anchor elements
        this._renderingEngine.htmlElementAnchorLoader.adjustPositions(adjustedWidth / width, adjustedHeight / height);

        // animation loop - part 11: adjust some scene settings
        // enable / disable the shadow map
        const enabled = this._renderingEngine.renderer.shadowMap.enabled;
        this._renderingEngine.renderer.shadowMap.enabled = this._renderingEngine.usingSwiftShader || this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES ? false : this._renderingEngine.shadows;
        if (enabled !== this._renderingEngine.renderer.shadowMap.enabled) this._renderingEngine.materialLoader.updateMaterials();
        let threeJsLightObject, oldLightVisibility = true;
        // enable / disable lights
        if (this._renderingEngine.lights === false) {
            const ls = this._renderingEngine.lightEngine.lightScene;
            if (ls) {
                threeJsLightObject = ls.node.convertedObject[this._renderingEngine.id] as THREE.Object3D;
                if (threeJsLightObject) {
                    oldLightVisibility = threeJsLightObject.visible;
                    threeJsLightObject.visible = false;
                }
            }
        }

        // update shadowMap if need
        if (states.updateShadowMap && this._renderingEngine.renderer.shadowMap.enabled) this._renderingEngine.renderer.shadowMap.needsUpdate = true;

        // enable / disable the background
        this._renderingEngine.sceneTreeManager.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        // set the background color / alpha
        this._renderingEngine.renderer.setClearColor(new THREE.Color(this._converter.toThreeJsColorInput(this._renderingEngine.clearColor)), this._renderingEngine.clearAlpha);

        // check if we should render with post-processing
        const renderPostProcessing = (this._renderingEngine.postProcessingManager.effects.length > 0 || this._renderingEngine.postProcessingManager.manualPostProcessing) &&
            !(this._renderingEngine.postProcessingManager.enablePostProcessingOnMobile === false && this._systemInfo.isMobile === true);

        // animation loop - part 12: actual rendering separation
        if (states.softShadowRendering === true) {
            this.setShaderProperties();

            if (renderPostProcessing) {
                this._renderingEngine.postProcessingManager.render(deltaTime, camera);
            } else {
                this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera);
            }

            // if the duration was long enough, disable the beauty rendering
            if (this._softShadowRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, { viewportId: this._renderingEngine.id });
                this.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            } else {
                this._softShadowRenderingDurationActive += deltaTime;
            }
        } else {
            if (renderPostProcessing) {
                this._renderingEngine.postProcessingManager.render(deltaTime, camera);
            } else {
                this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera);
            }

            // if the beauty rendering was active, disable it
            if (this._softShadowRenderingActive) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, { viewportId: this._renderingEngine.id });
                this.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            }
        }

        // reset the visibility of the threeJs light object
        if (threeJsLightObject)
            threeJsLightObject.visible = oldLightVisibility;

        if (this._renderingEngine.postRenderingCallback)
            this._renderingEngine.postRenderingCallback(this._renderingEngine.renderer, this._renderingEngine.scene, this._renderingEngine.camera);

        this._stats.end();
    }

    private calculateSize(): { adjustedWidth: number, adjustedHeight: number, width: number, height: number } {
        let width = this._width, height = this._height;
        if (this._renderingEngine.automaticResizing) {
            width = (<HTMLDivElement>this._renderingEngine.canvas.parentNode).clientWidth;
            height = (<HTMLDivElement>this._renderingEngine.canvas.parentNode).clientHeight;
        }

        const aspect = width / height;
        let adjustedWidth = width,
            adjustedHeight = height;

        if (width > this._renderingEngine.maximumRenderingSize.width || height > this._renderingEngine.maximumRenderingSize.height) {
            if ((width - this._renderingEngine.maximumRenderingSize.width) / aspect > (height - this._renderingEngine.maximumRenderingSize.height)) {
                adjustedWidth = this._renderingEngine.maximumRenderingSize.width;
                adjustedHeight = this._renderingEngine.maximumRenderingSize.width / aspect;
            } else {
                adjustedWidth = this._renderingEngine.maximumRenderingSize.height * aspect;
                adjustedHeight = this._renderingEngine.maximumRenderingSize.height;
            }
        }
        return {
            width, adjustedWidth,
            height, adjustedHeight
        };
    }

    private deactivateBeautyRenderShaders() {
        this._softShadowRenderingTimeout = null;
        this._softShadowRenderingActive = false;
        this._softShadowRenderingDurationActive = 0;
        this._renderingEngine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
        this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, 0.1);
        this._renderingEngine.materialLoader.updateMaterials();
    }

    private evaluateRenderingState(): {
        showScene: boolean,
        rendering: boolean,
        busyMode: boolean,
        updateShadowMap: boolean,
        softShadowRendering: boolean
    } {
        // If there is a camera to show the scene and the setting for it is set to true, we show the scene
        let showScene = false;
        if (this._renderingEngine.cameraEngine.camera && this._renderingEngine.show === true)
            showScene = true;

        // If we should render at all
        let rendering = false;
        if (this._activeRendering === true || this._cameraChanged === true || this._sizeChanged === true || this._runningAnimation === true || this._continuousRendering === true)
            rendering = true;

        let updateShadowMap = false;
        if (this._runningAnimation === true || this._continuousShadowMapUpdate === true)
            updateShadowMap = true;

        // special case, autorotation
        if (this._renderingEngine.cameraEngine.camera) {
            const camera = this._renderingEngine.cameraEngine.camera!;
            if (camera.type === CAMERA_TYPE.PERSPECTIVE) {
                const controls = <PerspectiveCameraControls>(<PerspectiveCamera>camera).controls;
                if (controls.enableAutoRotation === true && controls.autoRotationSpeed !== 0)
                    return { showScene, rendering: true, updateShadowMap, busyMode: this._renderingEngine.busy, softShadowRendering: false };
            }
        } else {
            rendering = false;
        }

        // If the scene should be blurred
        let busyMode = false;
        if (this._renderingEngine.busy)
            busyMode = true;

        // If we should render in beauty mode
        let softShadowRendering = false;
        if (this._softShadowRenderingActive === true && busyMode === false && this._continuousRendering === false &&
            (this._renderingEngine.shadows || !this._systemInfo.isIOS) &&
            this._renderingEngine.usingSwiftShader === false && this._runningAnimation === false && this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES)
            softShadowRendering = true;

        return { showScene, rendering, updateShadowMap, busyMode, softShadowRendering };
    }

    private setShaderProperties() {
        if (this._renderingEngine.softShadows === false) {
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, 0);
            return 0;
        }

        const deltaTime = Math.min(this._softShadowRenderingDurationActive, this._renderingEngine.beautyRenderBlendingDuration);
        const percentage = deltaTime / this._renderingEngine.beautyRenderBlendingDuration;

        if (percentage < 0.25) {
            const percentageMapped = percentage / 0.25;
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart, percentageMapped);

        } else {
            const percentageMapped = (percentage - 0.25) / (1 - 0.25);
            // this._lightSizeUVStart -> this._lightSizeUVEnd
            this._renderingEngine.materialLoader.updateSoftShadow(this._lightSizeUVStart + (this._lightSizeUVEnd - this._lightSizeUVStart) * percentageMapped, 1.0);
        }
        return percentage;
    }

    private showStatistics() {
        if (this._renderingEngine.showStatistics) {
            for (let i = 0; i < this._stats.stats.length; i++)
                this._stats.stats[i].dom.style.display = '';
        } else {
            for (let i = 0; i < this._stats.stats.length; i++)
                this._stats.stats[i].dom.style.display = 'none';
        }
    }

    private startAndStopRendering() {
        this._activeRendering = true;
        this.stopBeautyRenderCountdown();
        this.startBeautyRenderCountdown();
    }

    private startBeautyRenderCountdown() {
        this._softShadowRenderingTimeout = setTimeout(() => {
            this._softShadowRenderingActive = true;
            this._softShadowRenderingDurationActive = 0;
            this.activateBeautyRenderShaders();
        }, this._renderingEngine.beautyRenderDelay);
    }

    private startRendering() {
        this._activeRendering = true;
        this.stopBeautyRenderCountdown();
    }

    private stopBeautyRenderCountdown() {
        if (this._softShadowRenderingTimeout)
            clearTimeout(this._softShadowRenderingTimeout);
        this.deactivateBeautyRenderShaders();
    }

    private stopRendering() {
        this.startBeautyRenderCountdown();
    }

    private toggleBusyMode(toggle: boolean) {
        if (this._renderingEngine.branding.busyModeDisplay === BUSY_MODE_DISPLAY.BLUR) {
            this._renderingEngine.htmlElementAnchorLoader.toggleBusyMode(toggle);
            if (toggle) {
                if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                    return;
                this._renderingEngine.renderer.domElement.style.filter = 'blur(3px)';
            } else {
                this._renderingEngine.renderer.domElement.style.filter = '';
            }
        } else if (this._renderingEngine.branding.busyModeDisplay === BUSY_MODE_DISPLAY.SPINNER) {
            if (toggle) {
                this._renderingEngine.spinnerDivElement.style.visibility = 'visible';
            } else {
                this._renderingEngine.spinnerDivElement.style.visibility = 'hidden';
            }
        }
    }

    private toggleLogo(toggle: boolean) {
        if (this._renderingEngine.logoDivElement)
            this._renderingEngine.logoDivElement.style.display = toggle ? 'inherit' : 'none';
        if (this._renderingEngine.canvas)
            this._renderingEngine.canvas.style.display = !toggle ? 'inherit' : 'none';
    }

    // #endregion Private Methods (14)
}