import * as THREE from 'three'
import { vec3 } from 'gl-matrix'
import {
  AbstractCamera,
  CAMERATYPE,
  OrthographicCamera,
  PerspectiveCamera,
} from '@shapediver/viewer.rendering-engine.camera-engine'

import { IManager } from '../interfaces/IManager'
import { RenderingEngine } from '../RenderingEngine'

export class CameraManager implements IManager {
    // #region Properties (2)

    private readonly _orthographicCameraThree: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCameraThree: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public updateCamera(time: number, aspect: number): { position: vec3, target: vec3 } {
        if(this._renderingEngine.cameraEngine.getCamera()?.type === 'perspective') 
            (<PerspectiveCamera>this._renderingEngine.cameraEngine.getCamera()).aspect = aspect;
        return (<AbstractCamera>this._renderingEngine.cameraEngine.getCamera())!.update(time);

    }

    public adjustCamera(position: vec3, target: vec3, aspect: number): THREE.Camera {
        let cameraThree: THREE.Camera;
        if (this._renderingEngine.cameraEngine.getCamera()!.type === CAMERATYPE.ORTHOGRAPHIC) {
            const camera = <OrthographicCamera>this._renderingEngine.cameraEngine.getCamera()!;
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
            this._perspectiveCameraThree.aspect = camera.aspect = aspect;
            this._perspectiveCameraThree.far = camera.far = fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius;
            this._perspectiveCameraThree.near = camera.near = fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius;
            this._perspectiveCameraThree.position.set(position[0], position[1], position[2]);
            this._perspectiveCameraThree.lookAt(target[0], target[1], target[2]);
            this._perspectiveCameraThree.updateProjectionMatrix();
            cameraThree = this._perspectiveCameraThree;
        }
        return cameraThree;
    }

    public init(): void {
        this._orthographicCameraThree.up.set(0, 1, 0);
    }

    // #endregion Public Methods (2)
}