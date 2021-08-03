import * as TWEEN from '@tweenjs/tween.js'
import * as Stats from 'stats.js'
import * as THREE from 'three'
import {
  AbstractCamera,
  CAMERATYPE,
  OrthographicCamera,
  PerspectiveCamera,
  PerspectiveCameraControls
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { EventEngine, EVENTTYPE, StateEngine, SystemInfo } from '@shapediver/viewer.shared.services'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { RenderingEngine } from '../RenderingEngine'
import { SceneTreeManager } from './SceneTreeManager'
import { BeautyRenderingManager } from './BeautyRenderingManager'
import { IManager } from '../interfaces/IManager'

export class RenderingManager implements IManager {
    // #region Properties (13)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

    private _activeRendering: boolean = true;
    private _currentlyBlurred: boolean = false;
    private _height: number = 0;
    private _lastTime: number = 0;
    private _minimalRendering: boolean = false;
    private _noWebGL: boolean = false;
    private _stats: any;
    private _usingSwiftShader: boolean = false;
    private _width: number = 0;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
           * Getter minimalRendering
           * @return {boolean}
           */
    public get minimalRendering(): boolean {
        return this._minimalRendering;
    }

    /**
           * Getter usingSwiftShader
           * @return {boolean}
           */
    public get usingSwiftShader(): boolean {
        return this._usingSwiftShader;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (8)

    public addLogo(canvas: HTMLCanvasElement, logo: string): HTMLDivElement {
        const logoDivElement = document.createElement('div');
        logoDivElement.style.background = '#030531';
        logoDivElement.style.position = 'relative';
        logoDivElement.style.height = '100%';
        logoDivElement.style.width = '100%';
        canvas.parentElement?.insertBefore(logoDivElement, canvas.parentElement?.firstChild);

        const img = new Image();
        img.style.position = 'absolute';
        img.style.top = '50%';
        img.style.left = '50%';
        img.style.transform = 'translateX(-50%) translateY(-50%)';
        img.src = logo;
        logoDivElement.appendChild(img)

        return logoDivElement;
    }

    public createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
        const renderingProperties = {
            alpha: true,
            depth: false,
            antialias: true,
            preserveDrawingBuffer: true,
            canvas
        };

        const context = this.createWebGLContext(renderingProperties);

        const renderer = new THREE.WebGLRenderer(Object.assign({ context }, renderingProperties));
        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.physicallyCorrectLights = false;
        renderer.outputEncoding = THREE.LinearEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.setSize(canvas.width, canvas.height);
        renderer.setClearColor(new THREE.Color('#ffffff'), 1);
        return renderer
    }

    public getScreenshot(type: string = 'image/png', encoderOptions: number = 1): string {
        return this._renderingEngine.renderer.domElement.toDataURL(type, encoderOptions);
    }

    public init(): void {
        try {
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                this.startRendering();
            })
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                this.stopRendering();
            })

            window.onresize = () => { this.render(); };
            this._renderingEngine.canvas.canvasElement.onresize = () => { this.render(); };
            this._renderingEngine.canvas.canvasElement.parentElement!.onresize = () => { this.render(); };

            const stats1 = new Stats.default();
            stats1.showPanel(0); // Panel 0 = fps
            stats1.dom.style.cssText = 'position:absolute;top:0px;left:0px;display:none;';
            this._renderingEngine.canvas.canvasElement.parentElement!.appendChild(stats1.dom);

            const stats2 = new Stats.default();
            stats2.showPanel(1); // Panel 1 = ms
            stats2.dom.style.cssText = 'position:absolute;top:0px;left:80px;display:none;';
            this._renderingEngine.canvas.canvasElement.parentElement!.appendChild(stats2.dom);

            const stats3 = new Stats.default();
            stats3.showPanel(2); // Panel 2 = ms
            stats3.dom.style.cssText = 'position:absolute;top:0px;left:160px;display:none;';
            this._renderingEngine.canvas.canvasElement.parentElement!.appendChild(stats3.dom);

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
            throw new SDError(e.message, e);
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

    // #endregion Public Methods (8)

    // #region Private Methods (10)

    private animate(time: number): void {
        // animation loop - part 1: initial discarding
        if (this._renderingEngine.closed || this._noWebGL) return;

        // animation loop - part 2: requesting and timings
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        // animation loop - part 3: update the camera, if there are new movements, they will start / continue the rendering
        const { position, target } = this._renderingEngine.cameraEngine.hasCamera() ? this._renderingEngine.cameraManager.updateCamera(deltaTime) : { position: vec3.create(), target: vec3.create() };

        // animation loop - part 4: evaluating state
        const states = this.evaluateRenderingState();

        // animation loop - part 5: the scene is not even shown
        if (states.showScene === false) {
            // toggle on logo
            this.toggleLogo(true);
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
        this.toggleBlur(states.blurScene);

        // animation loop - part 8: calculate the current size
        const { width, height, adjustedWidth, adjustedHeight } = this.calculateSize();
        const aspect = width / height;
        this._renderingEngine.renderer.setSize(adjustedWidth, adjustedHeight);
        this._renderingEngine.renderer.domElement.style.width = width + 'px';
        this._renderingEngine.renderer.domElement.style.height = height + 'px';
        this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);

        // animation loop - part 9: adjust the camera
        const camera = this._renderingEngine.cameraManager.adjustCamera(position, target, aspect);

        // animation loop - part 10: adjust the anchor elements
        this._renderingEngine.htmlElementAnchorLoader.adjustPositions(adjustedWidth / width, adjustedHeight / height);

        // animation loop - part 11: adjust some scene settings
        // enable / disable the shadow map
        const enabled = this._renderingEngine.renderer.shadowMap.enabled;
        this._renderingEngine.renderer.shadowMap.enabled = this._renderingEngine.usingSwiftShader ? false : this._renderingEngine.shadows;
        if(enabled !== this._renderingEngine.renderer.shadowMap.enabled) this._renderingEngine.materialLoader.updateMaterials()
        // enable / disable the background
        this._renderingEngine.sceneTreeManager.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        // set the background color / alpha
        this._renderingEngine.renderer.setClearColor(new THREE.Color(this._renderingEngine.clearColor), this._renderingEngine.clearAlpha);

        // animation loop - part 12: actual rendering separation
        if (states.beautyRendering === true) {
            this._renderingEngine.beautyRenderingManager.render(deltaTime, camera, width, height);
            // if the duration was long enough, disable the beauty rendering
            if (this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            } else {
                this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive += deltaTime;
            }
        } else {
            this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera);

            // if the beauty rendering was active, disable it
            if (this._renderingEngine.beautyRenderingManager.beautyRenderingActive) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._activeRendering = false;
            }
        }

        if (!this._stateEngine.firstViewerShown.resolved) this._stateEngine.firstViewerShown.resolve(true);
        this._stats.end();
    }

    private calculateSize(): { adjustedWidth: number, adjustedHeight: number, width: number, height: number } {
        let width = this._width, height = this._height;
        if (this._renderingEngine.automaticResizing) {
            width = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientWidth;
            height = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientHeight;
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

            let _gl: WebGLRenderingContext | null = <WebGLRenderingContext>canvas.getContext('webgl', props) || canvas.getContext('experimental-webgl', props);

            // creation failed
            if (_gl === null) {
                // create without the attributes
                _gl = <WebGLRenderingContext>canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

                if (_gl !== null) {
                    this._logger.warn(LOGGINGTOPIC.VIEWER, 'RenderingLogic.createWebGLContext: We were unable to get a WebGL context using the requested attributes, falling back to default attributes.');
                } else {
                    throw new SDError('We were unable to get a WebGL context.');
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
                    this._logger.warn(LOGGINGTOPIC.VIEWER, 'RenderingLogic.createWebGLContext: The current device is using Google SwiftShader, a CPU-based renderer. To achieve better rendering results, please enable GPU-rendering in your settings.');
                }
            }

            if (!_gl.getExtension("EXT_shader_texture_lod"))
                this._minimalRendering = true;

            return _gl;
        } catch (error) {
            throw this._logger.error(LOGGINGTOPIC.VIEWER, new SDError('RenderingLogic.createWebGLContext: We were unable to get a WebGL context.', error), '', true);
        }
    }

    private evaluateRenderingState(): {
        showScene: boolean,
        rendering: boolean,
        blurScene: boolean,
        beautyRendering: boolean
    } {
        // If there is a camera to show the scene and the setting for it is set to true, we show the scene
        let showScene = false;
        if (this._renderingEngine.cameraEngine.hasCamera() === true && this._renderingEngine.show === true)
            showScene = true;

        // If we should render at all
        let rendering = false;
        if (this._activeRendering === true)
            rendering = true;

        // special case, autorotation
        if(this._renderingEngine.cameraEngine.hasCamera()) {
            const camera = this._renderingEngine.cameraEngine.getCamera()!;
            if(camera.type === CAMERATYPE.PERSPECTIVE) {
                const controls = <PerspectiveCameraControls>(<PerspectiveCamera>camera).controls;
                if(controls.enableAutoRotation === true && controls.autoRotationSpeed !== 0)
                    return { showScene, rendering: true, blurScene: false, beautyRendering: false };
            }
        }


        // If the scene should be blurred
        let blurScene = false;
        if (this._renderingEngine.blurSceneWhenBusy && this._renderingEngine.blur)
            blurScene = true;

        // If we should render in beauty mode
        let beautyRendering = false;
        if (this._renderingEngine.beautyRenderingManager.beautyRenderingActive === true && blurScene === false &&
            ((this._renderingEngine.shadows && this._systemInfo.isMobileDevice) || (this._renderingEngine.ambientOcclusion && !this._systemInfo.isIOSDevice)) &&
            this._renderingEngine.usingSwiftShader === false)
            beautyRendering = true;

        return { showScene, rendering, blurScene, beautyRendering };
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

    private toggleBlur(toggle: boolean) {
        if (toggle && !this._currentlyBlurred) {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                return;
            this._renderingEngine.renderer.domElement.style.filter = 'blur(3px)';
            this._currentlyBlurred = true;
        } else if (!this._renderingEngine.blur && this._currentlyBlurred) {
            this._renderingEngine.renderer.domElement.style.filter = '';
            this._currentlyBlurred = false;
        }
    }

    private toggleLogo(toggle: boolean) {
        if (this._renderingEngine.logoDivElement)
            this._renderingEngine.logoDivElement.style.display = toggle ? 'inherit' : 'none';
        if (this._renderingEngine.canvas.canvasElement)
            this._renderingEngine.canvas.canvasElement.style.display = !toggle ? 'inherit' : 'none';
    }

    // #endregion Private Methods (10)
}