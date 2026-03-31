import {
	AbstractCamera,
	CAMERA_TYPE,
	OrthographicCamera,
	PerspectiveCamera,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {IManager} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {mat4, vec3} from "gl-matrix";
import * as THREE from "three";
import {SDObject} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";

export class CameraManager implements IManager {
	// #region Properties (2)

	#camera: THREE.Camera = new THREE.PerspectiveCamera();
	#cameraCache: {[key: string]: THREE.Camera} = {};

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (1)

	public get camera(): THREE.Camera {
		return this.#camera;
	}

	// #endregion Public Getters And Setters (1)

	// #region Public Methods (4)

	public adjustCamera(aspect: number): {camera: THREE.Camera; matrix?: mat4} {
		let cameraThree: THREE.Camera;
		let matrix;

		const camera = this._renderingEngine.cameraEngine.camera!;
		if (camera.useNodeData) {
			const sdCameraNode = camera.convertedObject[
				this._renderingEngine.id
			] as THREE.Object3D;
			const sdCameraData = sdCameraNode.children[0];
			cameraThree = <THREE.Camera>sdCameraData.children[0];
		} else {
			if (
				this._renderingEngine.cameraEngine.camera!.type ===
				CAMERA_TYPE.ORTHOGRAPHIC
			) {
				const orthographicCameraData = <OrthographicCamera>camera;
				let orthographicCameraThreeJs = orthographicCameraData
					.convertedObject[
					this._renderingEngine.id
				] as THREE.OrthographicCamera;
				if (!orthographicCameraThreeJs)
					this.load(orthographicCameraData);
				orthographicCameraThreeJs = orthographicCameraData
					.convertedObject[
					this._renderingEngine.id
				] as THREE.OrthographicCamera;

				const distance =
					vec3.distance(
						orthographicCameraData.position,
						orthographicCameraData.target,
					) / 2;

				// For orthographic cameras, zooming is done via left/right/top/bottom,
				// not by moving the camera position. Use a safe position far enough
				// outside the scene so the camera never ends up inside the model.
				const bsOrtho =
					this._renderingEngine.sceneTreeManager.boundingBox
						.boundingSphere;
				const bsOrthoRadius = bsOrtho.radius > 0 ? bsOrtho.radius : 2;
				const orthoDir = vec3.normalize(
					vec3.create(),
					vec3.subtract(
						vec3.create(),
						orthographicCameraData.position,
						orthographicCameraData.target,
					),
				);
				const safeOrthoDistance = bsOrthoRadius + distance;
				const safeOrthoPos = vec3.scaleAndAdd(
					vec3.create(),
					orthographicCameraData.target,
					orthoDir,
					safeOrthoDistance,
				);

				orthographicCameraThreeJs.up.set(
					orthographicCameraData.up[0],
					orthographicCameraData.up[1],
					orthographicCameraData.up[2],
				);
				orthographicCameraThreeJs.left = orthographicCameraData.left =
					-distance * aspect;
				orthographicCameraThreeJs.bottom =
					orthographicCameraData.bottom = -distance;
				orthographicCameraThreeJs.right = orthographicCameraData.right =
					distance * aspect;
				orthographicCameraThreeJs.top = orthographicCameraData.top =
					distance;
				orthographicCameraThreeJs.near = orthographicCameraData.near =
					Math.max(0.0001, safeOrthoDistance - bsOrthoRadius);
				orthographicCameraThreeJs.far = orthographicCameraData.far =
					safeOrthoDistance + bsOrthoRadius;
				orthographicCameraThreeJs.position.set(
					safeOrthoPos[0],
					safeOrthoPos[1],
					safeOrthoPos[2],
				);
				orthographicCameraThreeJs.lookAt(
					orthographicCameraData.target[0],
					orthographicCameraData.target[1],
					orthographicCameraData.target[2],
				);
				orthographicCameraThreeJs.updateProjectionMatrix();

				if (
					orthographicCameraData.controls.enableTurntableControls ===
					true
				) {
					matrix = mat4.create();
					mat4.rotateZ(
						matrix,
						matrix,
						-orthographicCameraData.sceneRotation[1],
					);
					mat4.translate(
						matrix,
						matrix,
						orthographicCameraData.controls.turntableCenter,
					);
				} else if (
					orthographicCameraData.controls.enableObjectControls ===
					true
				) {
					matrix = mat4.create();
					mat4.rotateX(
						matrix,
						matrix,
						-orthographicCameraData.sceneRotation[0],
					);
					mat4.rotateZ(
						matrix,
						matrix,
						-orthographicCameraData.sceneRotation[1],
					);
					mat4.translate(
						matrix,
						matrix,
						orthographicCameraData.controls.objectControlsCenter,
					);
				}

				cameraThree = orthographicCameraThreeJs;
			} else {
				const perspectiveCameraData = <PerspectiveCamera>camera;
				let perspectiveCameraThreeJs = perspectiveCameraData
					.convertedObject[
					this._renderingEngine.id
				] as THREE.PerspectiveCamera;
				if (!perspectiveCameraThreeJs) this.load(perspectiveCameraData);
				perspectiveCameraThreeJs = perspectiveCameraData
					.convertedObject[
					this._renderingEngine.id
				] as THREE.PerspectiveCamera;

				perspectiveCameraThreeJs.up.set(0, 0, 1);
				const fov = (<PerspectiveCamera>(
					this._renderingEngine.cameraEngine.camera
				)).fov;
				const bs =
					this._renderingEngine.sceneTreeManager.boundingBox
						.boundingSphere;
				const radius = bs.radius > 0 ? bs.radius : 2;
				perspectiveCameraThreeJs.fov = perspectiveCameraData.fov = fov;
				perspectiveCameraThreeJs.aspect = perspectiveCameraData.aspect =
					aspect;
				perspectiveCameraThreeJs.far = perspectiveCameraData.far =
					fov < 10 ? fov * 100.0 * 100 * radius : 100 * radius;
				const cameraDistance = vec3.distance(
					perspectiveCameraData.position,
					perspectiveCameraData.target,
				);
				const defaultNear =
					fov < 10 ? fov * 100.0 * 0.01 * radius : 0.01 * radius;
				perspectiveCameraThreeJs.near = perspectiveCameraData.near =
					Math.max(
						0.0001,
						Math.min(defaultNear, cameraDistance * 0.01),
					);
				perspectiveCameraThreeJs.position.set(
					perspectiveCameraData.position[0],
					perspectiveCameraData.position[1],
					perspectiveCameraData.position[2],
				);
				perspectiveCameraThreeJs.lookAt(
					perspectiveCameraData.target[0],
					perspectiveCameraData.target[1],
					perspectiveCameraData.target[2],
				);
				perspectiveCameraThreeJs.updateProjectionMatrix();

				if (
					perspectiveCameraData.controls.enableTurntableControls ===
					true
				) {
					matrix = mat4.create();
					mat4.rotateZ(
						matrix,
						matrix,
						-perspectiveCameraData.sceneRotation[1],
					);
					mat4.translate(
						matrix,
						matrix,
						perspectiveCameraData.controls.turntableCenter,
					);
				} else if (
					perspectiveCameraData.controls.enableObjectControls === true
				) {
					matrix = mat4.create();
					mat4.rotateX(
						matrix,
						matrix,
						-perspectiveCameraData.sceneRotation[0],
					);
					mat4.rotateZ(
						matrix,
						matrix,
						-perspectiveCameraData.sceneRotation[1],
					);
					mat4.translate(
						matrix,
						matrix,
						perspectiveCameraData.controls.objectControlsCenter,
					);
				}

				cameraThree = perspectiveCameraThreeJs;
			}
		}

		this.#camera = cameraThree;
		return {camera: cameraThree, matrix};
	}

	public init(): void {}

	public load(camera: AbstractCamera, dataChild?: SDObject) {
		let threeCamera: THREE.Camera | null = this.#cameraCache[camera.id];

		if (camera instanceof PerspectiveCamera) {
			if (!threeCamera) {
				threeCamera = new THREE.PerspectiveCamera();
				this.#cameraCache[camera.id] = threeCamera;
				camera.convertedObject[this._renderingEngine.id] = <
					THREE.PerspectiveCamera
				>threeCamera;
				if (dataChild) dataChild.add(threeCamera);
			} else {
				camera.convertedObject[this._renderingEngine.id] = <
					THREE.PerspectiveCamera
				>threeCamera;
				if (
					dataChild &&
					!dataChild.children.find((t) => t === threeCamera)
				)
					dataChild.add(threeCamera);
			}
			const perspectiveCamera = <PerspectiveCamera>camera;
			const threePerspectiveCamera = <THREE.PerspectiveCamera>threeCamera;

			threePerspectiveCamera.up.set(0, 0, 1);
			if (perspectiveCamera.useNodeData) {
				threePerspectiveCamera.fov = perspectiveCamera.fov;
				threePerspectiveCamera.aspect = perspectiveCamera.aspect!;
				threePerspectiveCamera.far = perspectiveCamera.far;
				threePerspectiveCamera.near = perspectiveCamera.near;
				threePerspectiveCamera.updateProjectionMatrix();
			}
		} else {
			if (!threeCamera) {
				threeCamera = new THREE.OrthographicCamera(0, 0, 0, 0);
				this.#cameraCache[camera.id] = threeCamera;
				camera.convertedObject[this._renderingEngine.id] = <
					THREE.OrthographicCamera
				>threeCamera;
				if (dataChild) dataChild.add(threeCamera);
			} else {
				camera.convertedObject[this._renderingEngine.id] = <
					THREE.OrthographicCamera
				>threeCamera;
				if (
					dataChild &&
					!dataChild.children.find((t) => t === threeCamera)
				)
					dataChild.add(threeCamera);
			}
			const orthographicCamera = <OrthographicCamera>camera;
			const threeOrthographicCamera = <THREE.OrthographicCamera>(
				threeCamera
			);

			threeOrthographicCamera.up.set(
				orthographicCamera.up[0],
				orthographicCamera.up[1],
				orthographicCamera.up[2],
			);
			if (orthographicCamera.useNodeData) {
				threeOrthographicCamera.left = orthographicCamera.left;
				threeOrthographicCamera.bottom = orthographicCamera.bottom;
				threeOrthographicCamera.right = orthographicCamera.right;
				threeOrthographicCamera.top = orthographicCamera.top;
				threeOrthographicCamera.near = orthographicCamera.near;
				threeOrthographicCamera.far = orthographicCamera.far;
				threeOrthographicCamera.updateProjectionMatrix();
			}
		}

		return threeCamera;
	}

	public updateCamera(time: number, aspect: number): boolean {
		if (this._renderingEngine.cameraEngine.camera?.type === "perspective")
			(<PerspectiveCamera>(
				this._renderingEngine.cameraEngine.camera
			)).aspect = aspect;
		return (<AbstractCamera>(
			this._renderingEngine.cameraEngine.camera
		))!.update(time);
	}

	// #endregion Public Methods (4)
}
