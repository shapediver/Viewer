import * as TWEEN from '@tweenjs/tween.js'
import * as Stats from 'stats.js'
import * as THREE from 'three'
import {
  CAMERA_TYPE,
  PerspectiveCamera,
  PerspectiveCameraControls,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import {
  Converter,
  EventEngine,
  EVENTTYPE,
  Logger,
  LOGGING_TOPIC,
  ShapeDiverViewerWebGLError,
  StateEngine,
  SystemInfo,
} from '@shapediver/viewer.shared.services'
import { mat4, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'
import { ICameraEvent } from '@shapediver/viewer.shared.types'
import { BUSY_MODE_DISPLAY, RENDERER_TYPE, SPINNER_POSITIONING } from '@shapediver/viewer.rendering-engine.rendering-engine'

import { RenderingEngine } from '../RenderingEngine'
import { SceneTreeManager } from './SceneTreeManager'
import { IManager } from '../interfaces/IManager'
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree'

export class RenderingManager implements IManager {
    // #region Properties (20)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);
    private readonly _tree: ITree = <ITree>container.resolve(Tree);

    private _activeRendering: boolean = true;
    private _cameraChanged: boolean = false;
    private _continuousRendering: boolean = false;
    private _continuousShadowMapUpdate: boolean = false;
    private _height: number = 0;
    private _lastCameraMatrix: mat4 = mat4.create();
    private _lastRootVersion: string = '';
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
    private _lastTime: number = 0;
    private _maxTextureUnits: number = 0;
    private _minimalRendering: boolean = false;
    private _noWebGL: boolean = false;
    private _runningAnimation: boolean = false;
    private _sizeChanged: boolean = false;
    private _stats: any;
    private _usingSwiftShader: boolean = false;
    private _width: number = 0;

    // #endregion Properties (20)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

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

    public get lastRootVersion(): string {
        return this._lastRootVersion;
    }

    public set lastRootVersion(value: string) {
        this._lastRootVersion = value;
    }

    public get minimalRendering(): boolean {
        return this._minimalRendering;
    }

    public get usingSwiftShader(): boolean {
        return this._usingSwiftShader;
    }

    // #endregion Public Accessors (6)

    // #region Public Methods (9)

    public addLogo(canvas: HTMLCanvasElement, branding: {
        logo: string | null;
        backgroundColor: string;
        busyModeSpinner: string;
        busyModeDisplay: BUSY_MODE_DISPLAY;
        spinnerPositioning: SPINNER_POSITIONING
      }): HTMLDivElement {
        const logoDivElement = document.createElement('div');
        logoDivElement.style.backgroundColor = branding.backgroundColor;
        logoDivElement.style.position = 'relative';
        logoDivElement.style.height = '100%';
        logoDivElement.style.width = '100%';
        canvas.parentElement?.insertBefore(logoDivElement, canvas.parentElement?.firstChild);

        if(branding.logo) {
            const img = new Image();
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translateX(-50%) translateY(-50%)';
            img.src = branding.logo;
            logoDivElement.appendChild(img)
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
        spinnerDivElement.style.position = 'absolute';
        spinnerDivElement.style.userSelect = 'none';
        spinnerDivElement.style.cursor = 'default';
        spinnerDivElement.style.pointerEvents = 'none';

        if(branding.spinnerPositioning === SPINNER_POSITIONING.BOTTOM_RIGHT) {
            spinnerDivElement.style.right = '10px';
            spinnerDivElement.style.bottom = '10px';
        } else if(branding.spinnerPositioning === SPINNER_POSITIONING.BOTTOM_LEFT) {
            spinnerDivElement.style.left = '10px';
            spinnerDivElement.style.bottom = '10px';
        } else if(branding.spinnerPositioning === SPINNER_POSITIONING.TOP_RIGHT) {
            spinnerDivElement.style.right = '10px';
            spinnerDivElement.style.top = '10px';
        } else if(branding.spinnerPositioning === SPINNER_POSITIONING.TOP_LEFT) {
            spinnerDivElement.style.left = '10px';
            spinnerDivElement.style.top = '10px';
        } else {
            spinnerDivElement.style.height = '100%';
            spinnerDivElement.style.width = '100%';
        }

        spinnerDivElement.style.visibility = 'hidden';
        canvas.parentElement?.insertBefore(spinnerDivElement, canvas.parentElement?.firstChild);

        if(branding.busyModeSpinner) {
            const img = new Image();
            img.src = branding.busyModeSpinner;

            if(branding.spinnerPositioning === SPINNER_POSITIONING.CENTER) {
                img.style.position = 'absolute';
                img.style.top = '50%';
                img.style.left = '50%';
                img.style.transform = 'translateX(-50%) translateY(-50%)';
            } else {
                if(branding.spinnerPositioning === SPINNER_POSITIONING.BOTTOM_RIGHT || branding.spinnerPositioning === SPINNER_POSITIONING.TOP_RIGHT) {
                    img.style.float = 'right';
                } else if(branding.spinnerPositioning === SPINNER_POSITIONING.BOTTOM_LEFT || branding.spinnerPositioning === SPINNER_POSITIONING.TOP_LEFT) {
                    img.style.float = 'left';
                } 
                img.style.width = 'calc(100% * 0.75)';
                img.style.height = 'calc(100% * 0.75)';
            }
            spinnerDivElement.appendChild(img)
        }

        return spinnerDivElement;
    }

    public createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
        const renderingProperties = {
            alpha: true,
            depth: true,
            antialias: true,
            preserveDrawingBuffer: true,
            canvas
        };

        const context = this.createWebGLContext(renderingProperties);

        const renderer = new THREE.WebGLRenderer(Object.assign({ context }, renderingProperties));
        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.physicallyCorrectLights = false;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.localClippingEnabled = true;
        renderer.setSize(canvas.width, canvas.height);
        renderer.setClearColor(new THREE.Color('#ffffff'), 1);
        this._maxTextureUnits = renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_IMAGE_UNITS);
        return renderer
    }

    public evaluateTextureUnitCount(value: number) {
        if(value > this._maxTextureUnits) {
            this._logger.warn(LOGGING_TOPIC.VIEWPORT, `RenderingManager.evaluateTextureUnitCount: Maximum number of texture units exceeded. Disabling shadows.`);
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
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => {
                const viewerEvent = <ICameraEvent>e;
                if (viewerEvent.viewportId === this._renderingEngine.id)
                    this.startRendering();
            })
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
                const viewerEvent = <ICameraEvent>e;
                if (viewerEvent.viewportId === this._renderingEngine.id)
                    this.stopRendering();
            })

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
            throw e
        }
    }

    public render() {
        this.startAndStopRendering();
    }

    public resize(width: number, height: number) {
        this._width = width, this._height = height;
    }

    public start() {
        this.animate(0);
        this.startAndStopRendering();
    }

    public updateShadowMap() {
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
    }

    // #endregion Public Methods (9)

    // #region Private Methods (10)

    private animate(time: number): void {
        // animation loop - part 1: initial discarding
        if (this._renderingEngine.closed || this._noWebGL) return;

        // animation loop - part 2: requesting and timings
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        this._renderingEngine.evaluateFlagState();

        // update if needed
        if(this._tree.root.version !== this._lastRootVersion) {
            this._renderingEngine.sceneTreeManager.updateSceneTree(this._tree.root, this._renderingEngine.lightEngine);
            this.updateShadowMap();
            this._renderingEngine.startGatherAnimations();
            this._lastRootVersion = this._tree.root.version;
            this.render();
        }

        const runningAnimation = this._renderingEngine.animationManager.update(deltaTime);
        if(runningAnimation !== this._runningAnimation) this.render();
        this._runningAnimation = runningAnimation;
        if(this._runningAnimation) this._renderingEngine.sceneTreeManager.updateNodeTransformations();
        if(this._runningAnimation) this._renderingEngine.sceneTreeManager.updateMorphWeights();

        // get the current size
        const { width, height, adjustedWidth, adjustedHeight } = this.calculateSize();
        const aspect = width / height;
        this._sizeChanged = this._lastSize.adjustedHeight !== adjustedHeight || this._lastSize.adjustedWidth !== adjustedWidth || this._lastSize.height !== height || this._lastSize.width !== width;
        this._lastSize = { width, height, adjustedWidth, adjustedHeight };

        // animation loop - part 3: update the camera, if there are new movements, they will start / continue the rendering
        this._cameraChanged = this._renderingEngine.cameraEngine.camera ? this._renderingEngine.cameraManager.updateCamera(deltaTime, aspect) : false;

        // animation loop - part 4: evaluating state
        const states = this.evaluateRenderingState();

        // animation loop - part 5: the scene is not even shown
        if (states.showScene === false) {
            // toggle on logo
            this.toggleLogo(true);
            this.toggleBusyMode(false);
            return;
        } else {
            this.toggleLogo(false);
        }

        // animation loop - part 6: the scene is shown, but there is no active rendering happening
        if (states.rendering === false) return;

        // animation loop - part 7: there is actual rendering happening
        // do the things that have to be done for standard and beauty rendering in the same way
        this._stats.begin();
        this.showStatistics();

        // toggle the blurring
        this.toggleBusyMode(states.busyMode);

        // animation loop - part 8: calculate the current size
        const currentSize = new THREE.Vector2();
        this._renderingEngine.renderer.getSize(currentSize);
        if(!currentSize.equals(new THREE.Vector2(adjustedWidth, adjustedHeight))) {
            this._renderingEngine.renderer.setSize(adjustedWidth, adjustedHeight);
            this._renderingEngine.renderer.domElement.style.width = width + 'px';
            this._renderingEngine.renderer.domElement.style.height = height + 'px';
            this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);
        }

        // animation loop - part 9: adjust the camera (the rendering state would be false if we didn't have a camera)
        const camera = this._renderingEngine.cameraManager.adjustCamera(aspect);

        // animation loop - part 10: adjust the anchor elements
        this._renderingEngine.htmlElementAnchorLoader.adjustPositions(adjustedWidth / width, adjustedHeight / height);

        // animation loop - part 11: adjust some scene settings
        // enable / disable the shadow map
        const enabled = this._renderingEngine.renderer.shadowMap.enabled;
        this._renderingEngine.renderer.shadowMap.enabled = this._renderingEngine.usingSwiftShader || this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES ? false : this._renderingEngine.shadows;
        if (enabled !== this._renderingEngine.renderer.shadowMap.enabled) this._renderingEngine.materialLoader.updateMaterials()

        let threeJsLightObject, oldLightVisibility = true;
        // enable / disable lights
        if(this._renderingEngine.lights === false) {
            const ls = this._renderingEngine.lightEngine.lightScene;
            if(ls) {
                threeJsLightObject = ls.node.threeJsObject[this._renderingEngine.id];
                if(threeJsLightObject) {
                    oldLightVisibility = threeJsLightObject.visible;
                    threeJsLightObject.visible = false;
                }
            }
        }
        
        // update shadowMap if need
        if(states.updateShadowMap && this._renderingEngine.renderer.shadowMap.enabled) this._renderingEngine.renderer.shadowMap.needsUpdate = true;

        // enable / disable the background
        this._renderingEngine.sceneTreeManager.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        // set the background color / alpha
        this._renderingEngine.renderer.setClearColor(new THREE.Color(this._converter.toThreeJsColorInput(this._renderingEngine.clearColor)), this._renderingEngine.clearAlpha);

        // animation loop - part 12: actual rendering separation
        if (states.beautyRendering === true) {
            this._renderingEngine.beautyRenderingManager.render(deltaTime, camera, width, height);
            // if the duration was long enough, disable the beauty rendering
            if (this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, { viewportId: this._renderingEngine.id });
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            } else {
                this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive += deltaTime;
            }
        } else {
            this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera);

            // if the beauty rendering was active, disable it
            if (this._renderingEngine.beautyRenderingManager.beautyRenderingActive) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, { viewportId: this._renderingEngine.id });
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            }
        }

        // reset the visibility of the threeJs light object
        if(threeJsLightObject)
            threeJsLightObject.visible = oldLightVisibility;

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
        if (width > 1920 || height > 1080) {
            if ((width - 1920) / aspect > (height - 1080)) {
                adjustedWidth = 1920;
                adjustedHeight = 1920 / aspect;
            } else {
                adjustedWidth = 1080 * aspect;
                adjustedHeight = 1080;
            }
        }
        return {
            width, adjustedWidth,
            height, adjustedHeight
        }
    }

    private createWebGLContext(properties: {
        alpha: boolean,
        depth: boolean,
        antialias: boolean,
        preserveDrawingBuffer: boolean,
        canvas: HTMLCanvasElement,
    }): WebGLRenderingContext {
        try {
            let canvas = properties.canvas;
            canvas.addEventListener('webglcontextlost', () => { }, false);
            canvas.addEventListener('webglcontextrestored', () => { }, false);

            const props = Object.assign({
                stencil: true,
                premultipliedAlpha: true,
                powerPreference: 'default'
            }, properties);


            let _gl: WebGLRenderingContext | null = <WebGLRenderingContext>canvas.getContext('webgl2', props) || canvas.getContext('webgl', props) || canvas.getContext('experimental-webgl', props);

            // creation failed
            if (_gl === null) {
                // create without the attributes
                _gl = <WebGLRenderingContext>canvas.getContext('webgl2', props) || canvas.getContext('webgl', props) || canvas.getContext('experimental-webgl', props);

                if (_gl !== null) {
                    this._logger.warn(LOGGING_TOPIC.VIEWPORT, 'RenderingLogic.createWebGLContext: We were unable to get a WebGL context using the requested attributes, falling back to default attributes.');
                } else {
                    const error = new ShapeDiverViewerWebGLError('RenderingLogic.createWebGLContext: We were unable to get a WebGL context.');
                    throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `RenderingLogic.createWebGLContext`, error, false);
                }
            }

            // Some experimental-webgl implementations do not have getShaderPrecisionFormat
            if (_gl.getShaderPrecisionFormat === undefined) {
                _gl.getShaderPrecisionFormat = function () {
                    return { 'rangeMin': 1, 'rangeMax': 1, 'precision': 1 };
                };
            }

            const debugInfo = _gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
                const vendor = _gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = _gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer === "Google SwiftShader") {
                    this._usingSwiftShader = true;
                    this._logger.warn(LOGGING_TOPIC.VIEWPORT, 'RenderingLogic.createWebGLContext: The current device is using Google SwiftShader, a CPU-based renderer. To achieve better rendering results, please enable GPU-rendering in your settings.');
                }
            }

            if (!_gl.getExtension("EXT_shader_texture_lod"))
                this._minimalRendering = true;

            return _gl;
        } catch (e) {
            const error = new ShapeDiverViewerWebGLError('RenderingLogic.createWebGLContext: We were unable to get a WebGL context.', e);
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `RenderingLogic.createWebGLContext`, error, false);
        }
    }

    private evaluateRenderingState(): {
        showScene: boolean,
        rendering: boolean,
        busyMode: boolean,
        updateShadowMap: boolean,
        beautyRendering: boolean
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
                    return { showScene, rendering: true, updateShadowMap, busyMode: this._renderingEngine.busy, beautyRendering: false };
            }
        } else {
            rendering = false;
        }

        // If the scene should be blurred
        let busyMode = false;
        if (this._renderingEngine.busy)
            busyMode = true;

        // If we should render in beauty mode
        let beautyRendering = false;
        if (this._renderingEngine.beautyRenderingManager.beautyRenderingActive === true && busyMode === false && this._continuousRendering === false &&
            (this._renderingEngine.shadows || ((this._renderingEngine.ambientOcclusion && this._renderingEngine.ambientOcclusionIntensity > 0.0) && !this._systemInfo.isIOS)) &&
            this._renderingEngine.usingSwiftShader === false && this._runningAnimation === false && this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES)
            beautyRendering = true;

        return { showScene, rendering, updateShadowMap, busyMode, beautyRendering };
    }

    private showStatistics() {
        if (this._renderingEngine.showStatistics) {
            for (let i = 0; i < this._stats.stats.length; i++)
                this._stats.stats[i].dom.style.display = ''
        } else {
            for (let i = 0; i < this._stats.stats.length; i++)
                this._stats.stats[i].dom.style.display = 'none'
        }
    }

    private startAndStopRendering() {
        this._activeRendering = true;
        this._renderingEngine.beautyRenderingManager.stopBeautyRenderCountdown();
        this._renderingEngine.beautyRenderingManager.startBeautyRenderCountdown();
    }

    private startRendering() {
        this._activeRendering = true;
        this._renderingEngine.beautyRenderingManager.stopBeautyRenderCountdown();
    }

    private stopRendering() {
        this._renderingEngine.beautyRenderingManager.startBeautyRenderCountdown();
    }

    private toggleBusyMode(toggle: boolean) {
        if(this._renderingEngine.branding.busyModeDisplay === BUSY_MODE_DISPLAY.BLUR) {
            this._renderingEngine.htmlElementAnchorLoader.toggleBusyMode(toggle);
            if (toggle) {
                if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                    return;
                this._renderingEngine.renderer.domElement.style.filter = 'blur(3px)';
            } else {
                this._renderingEngine.renderer.domElement.style.filter = '';
            }
        } else if(this._renderingEngine.branding.busyModeDisplay === BUSY_MODE_DISPLAY.SPINNER) {
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

    // #endregion Private Methods (10)
}