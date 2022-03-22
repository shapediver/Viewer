import * as THREE from 'three'
import { mat4, vec3 } from 'gl-matrix'
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

    public updateCamera(time: number, aspect: number): mat4 {
        if(this._renderingEngine.cameraEngine.camera?.type === 'perspective') 
            (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).aspect = aspect;
        return (<AbstractCamera>this._renderingEngine.cameraEngine.camera)!.update(time);

    }

    public adjustCamera(cameraMatrix: mat4, aspect: number): THREE.Camera {
        let cameraThree: THREE.Camera;
        const threeMatrix = new THREE.Matrix4().fromArray(cameraMatrix);

        if (this._renderingEngine.cameraEngine.camera!.type === CAMERATYPE.ORTHOGRAPHIC) {
            const camera = <OrthographicCamera>this._renderingEngine.cameraEngine.camera!;
            const distance = vec3.distance(camera.position, camera.target) / 2;
            this._orthographicCameraThree.up.set(camera.up[0], camera.up[1], camera.up[2]);
            this._orthographicCameraThree.left = camera.left = camera.aspectOverride ? -distance * aspect : camera.left;
            this._orthographicCameraThree.bottom = camera.bottom = camera.aspectOverride ? -distance : camera.bottom;
            this._orthographicCameraThree.right = camera.right = camera.aspectOverride ? distance * aspect : camera.right;
            this._orthographicCameraThree.top = camera.top = camera.aspectOverride ? distance : camera.top;
            this._orthographicCameraThree.near = camera.near = camera.clippingPlanesOverride ? 0.01 : camera.near;
            this._orthographicCameraThree.far = camera.far = camera.clippingPlanesOverride ? 100 * distance : camera.far;
            this._perspectiveCameraThree.position.set(0,0,0);
            this._perspectiveCameraThree.quaternion.set(0,0,0,1);
            this._perspectiveCameraThree.scale.set(1,1,1);
            this._perspectiveCameraThree.applyMatrix4(threeMatrix);
            this._orthographicCameraThree.updateProjectionMatrix();
            cameraThree = this._orthographicCameraThree;
        } else {
            const camera = <PerspectiveCamera>this._renderingEngine.cameraEngine.camera!;
            this._perspectiveCameraThree.up.set(0, 0, 1);
            const fov = (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).fov;
            const bs = this._renderingEngine.sceneTreeManager.boundingBox.boundingSphere;
            const radius = bs.radius > 0 ? bs.radius : 2;
            this._perspectiveCameraThree.fov = camera.fov = fov;
            this._perspectiveCameraThree.aspect = camera.aspect = camera.aspectOverride || camera.aspect === undefined ? aspect : camera.aspect;
            this._perspectiveCameraThree.far = camera.far = camera.clippingPlanesOverride ? (fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius) : camera.far;
            this._perspectiveCameraThree.near = camera.near = camera.clippingPlanesOverride ? (fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius) : camera.near;
            this._perspectiveCameraThree.position.set(0,0,0);
            this._perspectiveCameraThree.quaternion.set(0,0,0,1);
            this._perspectiveCameraThree.scale.set(1,1,1);
            this._perspectiveCameraThree.applyMatrix4(threeMatrix);
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