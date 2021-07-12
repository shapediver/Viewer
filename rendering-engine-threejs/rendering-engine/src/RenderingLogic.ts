import { AbstractCamera, CAMERATYPE, OrthographicCamera, PerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { EventEngine, EVENTTYPE, StateEngine, SystemInfo } from "@shapediver/viewer.shared.services";
import { Logger, LOGGINGTOPIC, SDError } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import * as THREE from 'three';
import { container } from "tsyringe";
import { RenderingEngine } from "./RenderingEngine";
import { SceneTree } from "./SceneTree";
import { BeautyRenderer } from "./BeautyRenderer";
import * as TWEEN from "@tweenjs/tween.js";
import * as Stats from "stats.js";

export class RenderingLogic {
    // #region Properties (14)

    private readonly _beautyRenderer!: BeautyRenderer;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _orthographicCameraThree: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCameraThree: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _renderer!: THREE.WebGLRenderer;
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

    private _height: number = 0;
    private _lastTime: number = 0;
    private _minimalRendering: boolean = false;
    private _noNeedToRender: boolean = false;
    private _noWebGL: boolean = false;
    private _usingSwiftShader: boolean = false;
    private _width: number = 0;
    private _currentlyBlurred: boolean = false;
    private _stats: any;

    // #endregion Properties (14)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._width = this._renderingEngine.canvas.canvasElement.width;
        this._height = this._renderingEngine.canvas.canvasElement.height;

        const properties = {
            alpha: true,
            depth: false,
            antialias: true,
            preserveDrawingBuffer: true,
            canvas: this._renderingEngine.canvas.canvasElement,
        };

        try {
            const context = this.createWebGLContext(properties);

            this._renderer = new THREE.WebGLRenderer(Object.assign({ context }, properties));
            this._renderer.setPixelRatio(window.devicePixelRatio);

            this._renderer.physicallyCorrectLights = false;
            this._renderer.outputEncoding = THREE.LinearEncoding;
            this._renderer.shadowMap.enabled = true;
            this._renderer.shadowMap.needsUpdate = true;
            this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this._renderer.shadowMap.autoUpdate = false;
            this._renderer.setSize(this._width, this._height);
            this._renderer.setClearColor(new THREE.Color('#ffffff'), 1);

            this._beautyRenderer = new BeautyRenderer(this._renderingEngine, this._renderer, this._renderingEngine.sceneTree.scene)

            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                this._noNeedToRender = false;
                this._beautyRenderer.stopBeautyRenderCountdown();
            })
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._beautyRenderer.startBeautyRenderCountdown();
            })

            window.onresize = () => { this.render(); };
            this._renderingEngine.canvas.canvasElement.onresize = () => { this.render(); };
            this._renderingEngine.canvas.canvasElement.parentElement!.onresize = () => { this.render(); };

            const stats1 = new Stats.default();
            stats1.showPanel(0); // Panel 0 = fps
            stats1.dom.style.cssText = 'position:absolute;top:0px;left:0px;';
            this._renderingEngine.canvas.canvasElement.parentElement!.appendChild(stats1.dom);

            const stats2 = new Stats.default();
            stats2.showPanel(1); // Panel 1 = ms
            stats2.dom.style.cssText = 'position:absolute;top:0px;left:80px;';
            this._renderingEngine.canvas.canvasElement.parentElement!.appendChild(stats2.dom);

            const stats3 = new Stats.default();
            stats3.showPanel(2); // Panel 1 = ms
            stats3.dom.style.cssText = 'position:absolute;top:0px;left:160px;';
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

            this.animate(0);
            if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._beautyRenderer.startBeautyRenderCountdown();
        } catch (e) {
            this._noWebGL = true;
            throw new SDError(e.message, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    /**
     * Getter minimalRendering
     * @return {boolean }
     */
    public get minimalRendering(): boolean {
        return this._minimalRendering;
    }

    public get renderer(): THREE.WebGLRenderer {
        return this._renderer;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public getScreenshot(type: string = 'image/png', encoderOptions: number = 1): string {
        return this._renderer.domElement.toDataURL(type, encoderOptions);
    }

    public render() {
        this._noNeedToRender = false;
        if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._beautyRenderer.startBeautyRenderCountdown();
    }

    public resize(width: number, height: number) {
        this._width = width, this._height = height;
    }

    public updateShadowMap() {
        this._renderer.shadowMap.needsUpdate = true;
    }

    // #endregion Public Methods (3)

    // #region Private Methods (3)

    private adjustCamera(time: number, width: number, height: number): THREE.Camera {
        let cameraThree: THREE.Camera;
        const { position, target } = (<AbstractCamera>this._renderingEngine.cameraEngine.getCamera())!.update(time);
        if (this._renderingEngine.cameraEngine.getCamera()!.type === CAMERATYPE.ORTHOGRAPHIC) {
            const camera = <OrthographicCamera>this._renderingEngine.cameraEngine.getCamera()!;
            const aspect = width / height;
            const distance = vec3.distance(position, target) / 2;
            this._orthographicCameraThree.up.set(0, 0, 1);
            this._orthographicCameraThree.left = camera.left = -distance * aspect;
            this._orthographicCameraThree.bottom = camera.bottom = -distance;
            this._orthographicCameraThree.right = camera.right = distance * aspect;
            this._orthographicCameraThree.top = camera.top = distance;
            this._orthographicCameraThree.near = camera.near = 0.01 * distance;
            this._orthographicCameraThree.far = camera.far = 10000 * distance;
            this._orthographicCameraThree.position.set(position[0], position[1], position[2]);
            this._orthographicCameraThree.lookAt(target[0], target[1], target[2]);
            this._orthographicCameraThree.updateProjectionMatrix();
            cameraThree = this._orthographicCameraThree;
        } else {
            const camera = <PerspectiveCamera>this._renderingEngine.cameraEngine.getCamera()!;
            this._perspectiveCameraThree.up.set(0, 0, 1);
            const fov = (<PerspectiveCamera>this._renderingEngine.cameraEngine.getCamera()).fov;
            const bs = this._renderingEngine.sceneTree.boundingBox.boundingSphere;
            const radius = bs.radius > 0 ? bs.radius : 2;
            this._perspectiveCameraThree.fov = camera.fov = fov;
            this._perspectiveCameraThree.aspect = camera.aspect = width / height;
            this._perspectiveCameraThree.far = camera.far = fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius;
            this._perspectiveCameraThree.near = camera.near = fov < 10 ? fov * 100.0 * 0.1 * radius : 0.1 * radius;
            this._perspectiveCameraThree.position.set(position[0], position[1], position[2]);
            this._perspectiveCameraThree.lookAt(target[0], target[1], target[2]);
            this._perspectiveCameraThree.updateProjectionMatrix();
            cameraThree = this._perspectiveCameraThree;
        }
        return cameraThree;
    }

    private blurScene() {
        if (this._renderingEngine.blurSceneWhenBusy && this._renderingEngine.blur && !this._currentlyBlurred) {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                return;
            this._renderer.domElement.style.filter = 'blur(3px)';
            this._currentlyBlurred = true;
        } else if (!this._renderingEngine.blur && this._currentlyBlurred) {
            this._renderer.domElement.style.filter = '';
            this._currentlyBlurred = false;
        }
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

    private animate(time: number): void {
        if (this._renderingEngine.closed || this._noWebGL) return;
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        if (!this._renderingEngine.cameraEngine.hasCamera()) return;
        this._stats.begin();

        this.blurScene();
        this.showStatistics();
        let width = this._width, height = this._height;
        if (this._renderingEngine.automaticResizing) {
            width = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientWidth;
            height = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientHeight;
        }

        this._renderingEngine.logoDivElement.style.display = this._renderingEngine.show ? 'none' : 'inherit';
        this._renderingEngine.canvas.canvasElement.style.display = !this._renderingEngine.show ? 'none' : 'inherit';

        const camera = this.adjustCamera(deltaTime, width, height);

        if (this._noNeedToRender === true) return;
        if (this._renderingEngine.show === false) return;

        this._renderer.shadowMap.enabled = this._usingSwiftShader ? false : this._renderingEngine.shadows;
        this._renderingEngine.sceneTree.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        this._renderer.setClearColor(new THREE.Color(this._renderingEngine.clearColor), this._renderingEngine.clearAlpha);

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
        this._renderer.setSize(adjustedWidth, adjustedHeight);
        this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);

        this._renderer.domElement.style.width = width + 'px';
        this._renderer.domElement.style.height = height + 'px';

        this._renderingEngine.htmlElementAnchorLoader.adjustPositions();

        // beauty rendering is active
        if (this._beautyRenderer.beautyRenderingActive) {
            if (!(this._renderingEngine.shadows || (this._renderingEngine.ambientOcclusion && !this._systemInfo.isIOSDevice))) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._beautyRenderer.deactivateBeautyRenderShaders();
                this._noNeedToRender = true;
            }
            this._beautyRenderer.beautyRenderingDurationActive += deltaTime;
            this._usingSwiftShader ? this._renderer.render((<SceneTree>this._renderingEngine.sceneTree).scene, camera) : this._beautyRenderer.render(deltaTime, camera, width, height);
            if (this._beautyRenderer.beautyRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._beautyRenderer.deactivateBeautyRenderShaders();
                this._noNeedToRender = true;
            }
        } else {
            this._renderer.render((<SceneTree>this._renderingEngine.sceneTree).scene, camera);
        }

        if (!this._stateEngine.firstViewerShown.resolved) this._stateEngine.firstViewerShown.resolve(true);
        this._stats.end();
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

    // #endregion Private Methods (3)
}