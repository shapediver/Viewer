import { CAMERATYPE, OrthographicCamera, PerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { EventEngine, EVENTTYPE, StateEngine } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";
import * as THREE from 'three';
import { container } from "tsyringe";
import { RenderingEngine } from "./RenderingEngine";
import { SceneTree } from "./SceneTree";
import { main, entry } from "./shaders/PCSS";
import { shader as normalShader } from "./shaders/normal";
import { BeautyRenderer } from "./BeautyRenderer";
import * as TWEEN from "@tweenjs/tween.js";

export class RenderingLogic {
    // #region Properties (8)

    private readonly _beautyRenderer: BeautyRenderer;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _orthographicCameraThree: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCameraThree: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _renderer: THREE.WebGLRenderer;
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private _width: number = 0;
    private _height: number = 0;
    private _lastTime: number = 0;
    private _noNeedToRender: boolean = false;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        if(!shader.includes('PCSS implementation')) {
            shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + main);
            shader = shader.replace(shader.substr(shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), shader.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )') - shader.indexOf('#if defined( SHADOWMAP_TYPE_PCF )')), '#if defined( SHADOWMAP_TYPE_PCF )\n' + entry);
        }
        THREE.ShaderChunk.shadowmap_pars_fragment = shader;
        THREE.ShaderChunk.normalmap_pars_fragment = normalShader;

        this._width = this._renderingEngine.canvas.canvasElement.width;
        this._height = this._renderingEngine.canvas.canvasElement.height;

        this._renderer = new THREE.WebGLRenderer({
            alpha: true,
            depth: false,
            antialias: true,
            preserveDrawingBuffer: true,
            canvas: this._renderingEngine.canvas.canvasElement,
        });
        this._renderer.setPixelRatio(window.devicePixelRatio);

        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.needsUpdate = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
            this._beautyRenderer.startBeautyRenderCountdown();
        })

        window.onresize = () => { this.render(); };
        this._renderingEngine.canvas.canvasElement.onresize = () => { this.render(); };
        this._renderingEngine.canvas.canvasElement.parentElement!.onresize = () => { this.render(); };

        this.animate(0);
        this._beautyRenderer.startBeautyRenderCountdown();
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public getScreenshot(type: string = 'image/png', encoderOptions: number = 1): string {
        return this._renderer.domElement.toDataURL(type, encoderOptions);
    }

    public render() {
        this._noNeedToRender = false;
        this._beautyRenderer.startBeautyRenderCountdown();
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    private adjustCamera(time: number, width: number, height: number): THREE.Camera {
        let cameraThree: THREE.Camera;
        const { position, target } = this._renderingEngine.cameraEngine.getCamera()!.update(time);
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

    public resize(width: number, height: number) {
        this._width = width, this._height = height;
    }

    private animate(time: number): void {
        if(this._renderingEngine.closed) return;
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        if (!this._renderingEngine.cameraEngine.hasCamera()) return;

        let width = this._width, height = this._height;
        if(this._renderingEngine.automaticResizing) {
            width = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientWidth;
            height = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientHeight;
        }

        this._renderingEngine.logoDivElement.style.display = this._renderingEngine.show ? 'none' : 'inherit';

        const camera = this.adjustCamera(deltaTime, width, height);

        if (this._noNeedToRender === true) return;

        this._renderer.shadowMap.enabled = this._renderingEngine.shadows;
        this._renderingEngine.sceneTree.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        this._renderer.setClearColor(new THREE.Color(this._renderingEngine.clearColor), this._renderingEngine.clearAlpha);
        

        const aspect = width / height;
        let adjustedWidth = width,
            adjustedHeight = height;
        if(width > 1920 || height > 1080) {
            if((width-1920) / aspect > (height-1080)) {
                adjustedWidth = 1920;
                adjustedHeight = 1920 / aspect;
            } else {
                adjustedWidth = 1080 * aspect;
                adjustedHeight = 1080;
            }
        } 
        this._renderer.setSize(adjustedWidth, adjustedHeight);

        this._renderer.domElement.style.width = width + 'px';
        this._renderer.domElement.style.height = height + 'px';

        this._renderingEngine.htmlElementAnchorLoader.adjustPositions();

        // beauty rendering is active
        if (this._beautyRenderer.beautyRenderingActive) {
            this._beautyRenderer.beautyRenderingDurationActive += deltaTime;
            this._beautyRenderer.render(deltaTime, camera, width, height);
            if (this._beautyRenderer.beautyRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._beautyRenderer.deactivateBeautyRenderShaders();
                this._noNeedToRender = true;
            }
        } else {
            this._renderer.render((<SceneTree>this._renderingEngine.sceneTree).scene, camera);
        }

        if (!this._stateEngine.firstViewerShown.resolved) this._stateEngine.firstViewerShown.resolve(true);
    }

    // #endregion Private Methods (2)
}