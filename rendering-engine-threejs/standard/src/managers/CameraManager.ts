import * as THREE from 'three'
import { mat4, vec3 } from 'gl-matrix'
import {
  AbstractCamera,
  CAMERA_TYPE,
  OrthographicCamera,
  PerspectiveCamera,
} from '@shapediver/viewer.rendering-engine.camera-engine'

import { IManager } from '../interfaces/IManager'
import { RenderingEngine } from '../RenderingEngine'
import { SDNode } from '../types/SDNode'
import { SDData } from '../types/SDData'

export class CameraManager implements IManager {
    // #region Properties (2)

    private readonly _orthographicCameraThree: THREE.OrthographicCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1);
    private readonly _perspectiveCameraThree: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(1, 1, 1, 1);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public updateCamera(time: number, aspect: number): boolean {
        if(this._renderingEngine.cameraEngine.camera?.type === 'perspective') 
            (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).aspect = aspect;
        return (<AbstractCamera>this._renderingEngine.cameraEngine.camera)!.update(time);

    }

    public load(camera: AbstractCamera, dataChild: SDData) {
        let threeCamera: THREE.Camera | null = dataChild.children[0] instanceof THREE.Camera ? <THREE.Camera>dataChild.children[0] : null;

        if(camera instanceof PerspectiveCamera) {
            if(!threeCamera) {
                threeCamera = new THREE.PerspectiveCamera();
                dataChild.add(threeCamera);
            }
            const perspectiveCamera = <PerspectiveCamera>camera;
            const threePerspectiveCamera = <THREE.PerspectiveCamera>threeCamera;

            threePerspectiveCamera.up.set(0, 0, 1);
            if(perspectiveCamera.useNodeData) {
                threePerspectiveCamera.fov = perspectiveCamera.fov;
                threePerspectiveCamera.aspect = perspectiveCamera.aspect!;
                threePerspectiveCamera.far = perspectiveCamera.far;
                threePerspectiveCamera.near = perspectiveCamera.near;
                threePerspectiveCamera.updateProjectionMatrix();
            }

        } else {
            if(!threeCamera) {
                threeCamera = new THREE.OrthographicCamera(0, 0, 0, 0);
                dataChild.add(threeCamera);
            }
            const orthographicCamera = <OrthographicCamera>camera;
            const threeOrthographicCamera = <THREE.OrthographicCamera>threeCamera;

            threeOrthographicCamera.up.set(orthographicCamera.up[0], orthographicCamera.up[1], orthographicCamera.up[2]);
            if(orthographicCamera.useNodeData) {
                threeOrthographicCamera.left = orthographicCamera.left;
                threeOrthographicCamera.bottom = orthographicCamera.bottom;
                threeOrthographicCamera.right = orthographicCamera.right;
                threeOrthographicCamera.top = orthographicCamera.top;
                threeOrthographicCamera.near = orthographicCamera.near;
                threeOrthographicCamera.far = orthographicCamera.far;
                threeOrthographicCamera.updateProjectionMatrix();
            }
        }
    }

    public adjustCamera(aspect: number): THREE.Camera {
        let cameraThree: THREE.Camera;

        const camera = this._renderingEngine.cameraEngine.camera!;
        if(camera.useNodeData) {
            const sdCameraNode = <SDNode>camera.node!.transformedNodes[this._renderingEngine.id];
            const sdCameraData = <SDData>sdCameraNode.children[0];
            cameraThree = <THREE.Camera>sdCameraData.children[0];
        } else {
            if (this._renderingEngine.cameraEngine.camera!.type === CAMERA_TYPE.ORTHOGRAPHIC) {
                const camera = <OrthographicCamera>this._renderingEngine.cameraEngine.camera!;
                const distance = vec3.distance(camera.position, camera.target) / 2;
                this._orthographicCameraThree.up.set(camera.up[0], camera.up[1], camera.up[2]);
                this._orthographicCameraThree.left = camera.left = -distance * aspect;
                this._orthographicCameraThree.bottom = camera.bottom = -distance;
                this._orthographicCameraThree.right = camera.right = distance * aspect;
                this._orthographicCameraThree.top = camera.top = distance;
                this._orthographicCameraThree.near = camera.near = 0.01;
                this._orthographicCameraThree.far = camera.far = 100 * distance;
                this._orthographicCameraThree.position.set(camera.position[0], camera.position[1], camera.position[2]);
                this._orthographicCameraThree.lookAt(camera.target[0], camera.target[1], camera.target[2]);
                this._orthographicCameraThree.updateProjectionMatrix();
                cameraThree = this._orthographicCameraThree;
            } else {
                const camera = <PerspectiveCamera>this._renderingEngine.cameraEngine.camera!;
                this._perspectiveCameraThree.up.set(0, 0, 1);
                const fov = (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).fov;
                const bs = this._renderingEngine.sceneTreeManager.boundingBox.boundingSphere;
                const radius = bs.radius > 0 ? bs.radius : 2;
                this._perspectiveCameraThree.fov = camera.fov = fov;
                this._perspectiveCameraThree.aspect = camera.aspect = aspect;
                this._perspectiveCameraThree.far = camera.far = (fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius);
                this._perspectiveCameraThree.near = camera.near = (fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius);
                this._perspectiveCameraThree.position.set(camera.position[0], camera.position[1], camera.position[2]);
                this._perspectiveCameraThree.lookAt(camera.target[0], camera.target[1], camera.target[2]);
                this._perspectiveCameraThree.updateProjectionMatrix();
                cameraThree = this._perspectiveCameraThree;
            }
        }
        
        return cameraThree;
    }

    public init(): void {
        this._orthographicCameraThree.up.set(0, 1, 0);
    }

    // #endregion Public Methods (2)
}