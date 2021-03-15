import { CAMERATYPE, PerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";
import * as THREE from 'three';
import { container } from "tsyringe";
import { RenderingEngine } from "./RenderingEngine";
import { SceneTree } from "./SceneTree";

export class RenderingLogic {
    // #region Properties (4)

    private readonly _orthographicCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _renderer: THREE.WebGLRenderer;
    private readonly _eventEngine: EventEngine = container.resolve(EventEngine);

    private _lastTime: number = 0;
    private _beautyRenderingTimeout: NodeJS.Timeout | null = null;
    private _beautyRenderingStart: boolean = false;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
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
        this._renderer.shadowMap.type = THREE.VSMShadowMap;
        this._renderer.setSize(this._renderingEngine.canvas.canvasElement.width, this._renderingEngine.canvas.canvasElement.height);
        this._renderer.setClearColor(new THREE.Color(0xffffff));

        this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_START, (e) => { 
            this.stopBeautyRenderCountdown();
        })
        this._eventEngine.addListener(EVENTTYPE.CAMERA.CAMERA_END, (e) => { 
            this.startBeautyRenderCountdown();
        })
        this.animate(0);
    }

    private startBeautyRenderCountdown() {
        this._beautyRenderingTimeout = setTimeout(() => {
            this._beautyRenderingStart = true;
        }, this._renderingEngine.beautyRenderDelay);
    }    
    
    private stopBeautyRenderCountdown() {
        if(this._beautyRenderingTimeout) 
            clearTimeout(this._beautyRenderingTimeout);
        this._beautyRenderingTimeout = null;
    }

    // #endregion Constructors (1)

    // #region Private Methods (2)

    private adjustCamera(time: number, width: number, height: number): THREE.Camera {
        let camera: THREE.Camera;
        const cameraDefinition = this._renderingEngine.cameraEngine.getCamera().update(time);
        if (this._renderingEngine.cameraEngine.getCamera().type === CAMERATYPE.ORTHOGRAPHIC) {
            const aspect = width / height;
            const distance = vec3.distance(cameraDefinition.position, cameraDefinition.target) / 2;
            this._orthographicCamera.up.set(0, 0, 1);
            this._orthographicCamera.left = -distance * aspect;
            this._orthographicCamera.bottom = -distance;
            this._orthographicCamera.right = distance * aspect;
            this._orthographicCamera.top = distance;
            this._orthographicCamera.near = 0.01 * distance;
            this._orthographicCamera.far = 10000 * distance;
            this._orthographicCamera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
            this._orthographicCamera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2]);
            this._orthographicCamera.updateProjectionMatrix();
            camera = this._orthographicCamera;
        } else {
            this._perspectiveCamera.up.set(0, 0, 1);
            const fov = (<PerspectiveCamera>this._renderingEngine.cameraEngine.getCamera()).fov;
            const bs = this._renderingEngine.sceneTree.boundingBox.boundingSphere;
            this._perspectiveCamera.fov = fov;
            this._perspectiveCamera.aspect = width / height;
            this._perspectiveCamera.far = fov < 10 ? fov * 100.0 * 100 * bs.radius : 100 * bs.radius;
            this._perspectiveCamera.near = fov < 10 ? fov * 100.0 * 0.1 * bs.radius : 0.1 * bs.radius;
            this._perspectiveCamera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
            this._perspectiveCamera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2]);
            this._perspectiveCamera.updateProjectionMatrix();
            camera = this._perspectiveCamera;
        }
        return camera;
    }

    private animate(time: number): void {
        requestAnimationFrame((time: number) => this.animate(time));
        const deltaTime = time - this._lastTime < 0 ? 0 : time - this._lastTime;
        this._lastTime = time;

        if (!this._renderingEngine.cameraEngine.hasCamera()) return;
        (<HTMLCanvasElement>document.getElementById('canvas')).width = window.innerWidth;
        (<HTMLCanvasElement>document.getElementById('canvas')).height = window.innerHeight;
        let width: number = window.innerWidth, height: number = window.innerHeight;

        const camera = this.adjustCamera(deltaTime, width, height);
        this._renderer.setSize(width, height);
        this._renderer.render((<SceneTree>this._renderingEngine.sceneTree).scene, camera);


        if(this._beautyRenderingStart) {
            console.log('BEAUTY')
            this._beautyRenderingStart = false;
        }
    }

    // #endregion Private Methods (2)
}