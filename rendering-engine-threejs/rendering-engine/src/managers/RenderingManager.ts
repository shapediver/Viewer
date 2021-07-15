import * as TWEEN from '@tweenjs/tween.js'
import * as Stats from 'stats.js'
import * as THREE from 'three'
import {
  AbstractCamera,
  CAMERATYPE,
  OrthographicCamera,
  PerspectiveCamera,
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
    private readonly _orthographicCameraThree: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCameraThree: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

    private _currentlyBlurred: boolean = false;
    private _height: number = 0;
    private _lastTime: number = 0;
    private _noNeedToRender: boolean = false;
    private _noWebGL: boolean = false;
    private _stats: any;
    private _width: number = 0;

    // #endregion Properties (13)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (6)

    public getScreenshot(type: string = 'image/png', encoderOptions: number = 1): string {
        return this._renderingEngine.renderer.domElement.toDataURL(type, encoderOptions);
    }

    public init(): void {
        this._orthographicCameraThree.up.set(0,1,0);

        try {
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                this._noNeedToRender = false;
                this._renderingEngine.beautyRenderingManager.stopBeautyRenderCountdown();
            })
            this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => {
                // https://shapediver.atlassian.net/browse/SS-2956, add viewer id, could be another one
                if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._renderingEngine.beautyRenderingManager.startBeautyRenderCountdown();
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
        } catch (e) {
            this._noWebGL = true;
            throw new SDError(e.message, e);
        }    
    }

    public render() {
        this._noNeedToRender = false;
        if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._renderingEngine.beautyRenderingManager.startBeautyRenderCountdown();
    }

    public resize(width: number, height: number) {
        this._width = width, this._height = height;
    }

    public start() {
        this.animate(0);
        if(this._renderingEngine.shadows === true || this._renderingEngine.ambientOcclusion === true) this._renderingEngine.beautyRenderingManager.startBeautyRenderCountdown();
    }

    public updateShadowMap() {
        this._renderingEngine.renderer.shadowMap.needsUpdate = true;
    }

    // #endregion Public Methods (6)

    // #region Private Methods (4)

    private adjustCamera(time: number, width: number, height: number): THREE.Camera {
        let cameraThree: THREE.Camera;
        const { position, target } = (<AbstractCamera>this._renderingEngine.cameraEngine.getCamera())!.update(time);
        if (this._renderingEngine.cameraEngine.getCamera()!.type === CAMERATYPE.ORTHOGRAPHIC) {
            const camera = <OrthographicCamera>this._renderingEngine.cameraEngine.getCamera()!;
            const aspect = width / height;
            const distance = vec3.distance(position, target) / 2;
            this._orthographicCameraThree.up.set(camera.up[0], camera.up[1], camera.up[2]);
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
            const bs = this._renderingEngine.sceneTreeManager.boundingBox.boundingSphere;
            const radius = bs.radius > 0 ? bs.radius : 2;
            this._perspectiveCameraThree.fov = camera.fov = fov;
            this._perspectiveCameraThree.aspect = camera.aspect = width / height;
            this._perspectiveCameraThree.far = camera.far = fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius;
            this._perspectiveCameraThree.near = camera.near = fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius;
            this._perspectiveCameraThree.position.set(position[0], position[1], position[2]);
            this._perspectiveCameraThree.lookAt(target[0], target[1], target[2]);
            this._perspectiveCameraThree.updateProjectionMatrix();
            cameraThree = this._perspectiveCameraThree;
        }
        return cameraThree;
    }

    private animate(time: number): void {
        if (this._renderingEngine.closed || this._noWebGL) return;
        requestAnimationFrame((time: number) => this.animate(time));
        TWEEN.update(time);
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        this._stats.begin();

        this.blurScene();
        this.showStatistics();
        let width = this._width, height = this._height;
        if (this._renderingEngine.automaticResizing) {
            width = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientWidth;
            height = (<HTMLDivElement>this._renderingEngine.canvas.canvasElement.parentNode).clientHeight;
        }

        const logo: boolean = this._renderingEngine.cameraEngine.hasCamera() && this._renderingEngine.show;
        if(this._renderingEngine.logoDivElement) {
            this._renderingEngine.logoDivElement.style.display = logo ? 'none' : 'inherit';
            this._renderingEngine.canvas.canvasElement.style.display = !logo ? 'none' : 'inherit';
        }

        if (!this._renderingEngine.cameraEngine.hasCamera()) return;
        const camera = this.adjustCamera(deltaTime, width, height);

        if (this._noNeedToRender === true) return;
        if (this._renderingEngine.show === false) return;

        this._renderingEngine.renderer.shadowMap.enabled = this._renderingEngine.usingSwiftShader ? false : this._renderingEngine.shadows;
        this._renderingEngine.sceneTreeManager.scene.background = this._renderingEngine.environmentMapAsBackground ? this._renderingEngine.environmentMapLoader.environmentMap : null;
        this._renderingEngine.renderer.setClearColor(new THREE.Color(this._renderingEngine.clearColor), this._renderingEngine.clearAlpha);

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
        
        this._renderingEngine.renderer.setSize(adjustedWidth, adjustedHeight);
        this._renderingEngine.materialLoader.assignPointSize(this._renderingEngine.pointSize);

        this._renderingEngine.renderer.domElement.style.width = width + 'px';
        this._renderingEngine.renderer.domElement.style.height = height + 'px';

        this._renderingEngine.htmlElementAnchorLoader.adjustPositions(adjustedWidth / width, adjustedHeight / height);

        // beauty rendering is active
        if (this._renderingEngine.beautyRenderingManager.beautyRenderingActive) {
            if (!(this._renderingEngine.shadows || (this._renderingEngine.ambientOcclusion && !this._systemInfo.isIOSDevice))) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._noNeedToRender = true;
            }
            this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive += deltaTime;
            this._renderingEngine.usingSwiftShader ? this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera) : this._renderingEngine.beautyRenderingManager.render(deltaTime, camera, width, height);
            if (this._renderingEngine.beautyRenderingManager.beautyRenderingDurationActive >= this._renderingEngine.beautyRenderBlendingDuration) {
                this._eventEngine.emitEvent(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, {});
                this._renderingEngine.beautyRenderingManager.deactivateBeautyRenderShaders();
                this._noNeedToRender = true;
            }
        } else {
            this._renderingEngine.renderer.render((<SceneTreeManager>this._renderingEngine.sceneTreeManager).scene, camera);
        }

        if (!this._stateEngine.firstViewerShown.resolved) this._stateEngine.firstViewerShown.resolve(true);
        this._stats.end();
    }

    private blurScene() {
        if (this._renderingEngine.blurSceneWhenBusy && this._renderingEngine.blur && !this._currentlyBlurred) {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                return;
            this._renderingEngine.renderer.domElement.style.filter = 'blur(3px)';
            this._currentlyBlurred = true;
        } else if (!this._renderingEngine.blur && this._currentlyBlurred) {
            this._renderingEngine.renderer.domElement.style.filter = '';
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

    // #endregion Private Methods (4)
}