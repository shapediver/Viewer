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
import { SDData } from '../objects/SDData'

export class CameraManager implements IManager {
    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public updateCamera(time: number, aspect: number): boolean {
        if(this._renderingEngine.cameraEngine.camera?.type === 'perspective') 
            (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).aspect = aspect;
        return (<AbstractCamera>this._renderingEngine.cameraEngine.camera)!.update(time);

    }

    public load(camera: AbstractCamera, dataChild?: SDData) {
        let threeCamera: THREE.Camera | null = dataChild && dataChild.children[0] instanceof THREE.Camera ? <THREE.Camera>dataChild.children[0] : null;

        if(camera instanceof PerspectiveCamera) {
            if(!threeCamera) {
                threeCamera = new THREE.PerspectiveCamera();
                (<PerspectiveCamera>camera).threeJsObject[this._renderingEngine.id] = <THREE.PerspectiveCamera>threeCamera;
                if(dataChild)
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
                (<OrthographicCamera>camera).threeJsObject[this._renderingEngine.id] = <THREE.OrthographicCamera>threeCamera;
                if(dataChild)
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
            const sdCameraNode = camera.node!.threeJsObject[this._renderingEngine.id];
            const sdCameraData = sdCameraNode.children[0];
            cameraThree = <THREE.Camera>sdCameraData.children[0];
        } else {
            if (this._renderingEngine.cameraEngine.camera!.type === CAMERA_TYPE.ORTHOGRAPHIC) {
                const orthographicCameraData = <OrthographicCamera>camera;
                let orthographicCameraThreeJs = orthographicCameraData.threeJsObject[this._renderingEngine.id];
                if(!orthographicCameraThreeJs) this.load(orthographicCameraData)
                orthographicCameraThreeJs = orthographicCameraData.threeJsObject[this._renderingEngine.id];

                const distance = vec3.distance(orthographicCameraData.position, orthographicCameraData.target) / 2;
                orthographicCameraThreeJs.up.set(orthographicCameraData.up[0], orthographicCameraData.up[1], orthographicCameraData.up[2]);
                orthographicCameraThreeJs.left = orthographicCameraData.left = -distance * aspect;
                orthographicCameraThreeJs.bottom = orthographicCameraData.bottom = -distance;
                orthographicCameraThreeJs.right = orthographicCameraData.right = distance * aspect;
                orthographicCameraThreeJs.top = orthographicCameraData.top = distance;
                orthographicCameraThreeJs.near = orthographicCameraData.near = 0.01;
                orthographicCameraThreeJs.far = orthographicCameraData.far = 100 * distance;
                orthographicCameraThreeJs.position.set(orthographicCameraData.position[0], orthographicCameraData.position[1], orthographicCameraData.position[2]);
                orthographicCameraThreeJs.lookAt(orthographicCameraData.target[0], orthographicCameraData.target[1], orthographicCameraData.target[2]);
                orthographicCameraThreeJs.updateProjectionMatrix();
                cameraThree = orthographicCameraThreeJs;
            } else {
                const perspectiveCameraData = <PerspectiveCamera>camera;
                let perspectiveCameraThreeJs = perspectiveCameraData.threeJsObject[this._renderingEngine.id];
                if(!perspectiveCameraThreeJs) this.load(perspectiveCameraData)
                perspectiveCameraThreeJs = perspectiveCameraData.threeJsObject[this._renderingEngine.id];

                perspectiveCameraThreeJs.up.set(0, 0, 1);
                const fov = (<PerspectiveCamera>this._renderingEngine.cameraEngine.camera).fov;
                const bs = this._renderingEngine.sceneTreeManager.boundingBox.boundingSphere;
                const radius = bs.radius > 0 ? bs.radius : 2;
                perspectiveCameraThreeJs.fov = perspectiveCameraData.fov = fov;
                perspectiveCameraThreeJs.aspect = perspectiveCameraData.aspect = aspect;
                perspectiveCameraThreeJs.far = perspectiveCameraData.far = (fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius);
                perspectiveCameraThreeJs.near = perspectiveCameraData.near = (fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius);
                perspectiveCameraThreeJs.position.set(perspectiveCameraData.position[0], perspectiveCameraData.position[1], perspectiveCameraData.position[2]);
                perspectiveCameraThreeJs.lookAt(perspectiveCameraData.target[0], perspectiveCameraData.target[1], perspectiveCameraData.target[2]);
                perspectiveCameraThreeJs.updateProjectionMatrix();
                cameraThree = perspectiveCameraThreeJs;
            }
        }
        
        return cameraThree;
    }

    public init(): void {}

    // #endregion Public Methods (2)
}