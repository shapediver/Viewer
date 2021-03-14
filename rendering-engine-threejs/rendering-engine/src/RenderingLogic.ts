import { CAMERATYPE, ICameraEngine, PerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Canvas } from "@shapediver/viewer.rendering-engine.canvas-engine";
import { vec3 } from "gl-matrix";
import * as THREE from 'three';
import { singleton } from "tsyringe";
import { SceneTree } from "./SceneTree";

export class RenderingLogic {
    // #region Properties (4)

    private readonly _orthographicCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);
    private readonly _renderer: THREE.WebGLRenderer;

    private _lastTime: number = 0;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _cameraEngine: ICameraEngine, private readonly _canvas: Canvas, private readonly _sceneTree: SceneTree) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas.canvasElement,
            antialias: true,
        });
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.setSize(this._canvas.canvasElement.width, this._canvas.canvasElement.height);
        this._renderer.setClearColor(new THREE.Color(0xffffff))
        this.animate(0);
    }

    // #endregion Constructors (1)

    // #region Private Methods (2)

    private adjustCamera(time: number): THREE.Camera {
        let camera: THREE.Camera;
        const cameraDefinition = this._cameraEngine.getCamera().update(time);
        if (this._cameraEngine.getCamera().type === CAMERATYPE.ORTHOGRAPHIC) {
            const aspect = this._canvas.canvasElement.width / this._canvas.canvasElement.height;
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
            this._perspectiveCamera.aspect = this._canvas.canvasElement.width / this._canvas.canvasElement.height;
            this._perspectiveCamera.near = 0.01;
            this._perspectiveCamera.far = 10000;
            this._perspectiveCamera.updateProjectionMatrix();
            camera = this._perspectiveCamera;
        }
        camera.position.set(cameraDefinition.position[0], cameraDefinition.position[1], cameraDefinition.position[2]);
        camera.lookAt(cameraDefinition.target[0], cameraDefinition.target[1], cameraDefinition.target[2]);
        return camera;
    }

    private animate(time: number): void {
        requestAnimationFrame((time: number) => this.animate(time));
        let deltaTime = time - this._lastTime;
        deltaTime = deltaTime < 0 ? 0 : deltaTime;
        this._lastTime = time;
        try {
            this._cameraEngine.getCamera();
            const camera = this.adjustCamera(deltaTime);
            this._renderer.setSize(this._canvas.canvasElement.width, this._canvas.canvasElement.height);
            this._renderer.render((<SceneTree>this._sceneTree).scene, camera);
        } catch (e) { console.log(e) }
    }

    // #endregion Private Methods (2)
}