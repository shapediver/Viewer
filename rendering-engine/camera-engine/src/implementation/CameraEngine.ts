import {type IRenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {Box} from "@shapediver/viewer.shared.math";
import {
	type ITree,
	type ITreeNode,
	Tree,
	TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	type IEvent,
	Logger,
	SettingsEngine,
	ShapeDiverViewerCameraError,
	StateEngine,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	CAMERA_TYPE,
	type ISceneEvent,
	ORTHOGRAPHIC_CAMERA_DIRECTION} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {type ICamera} from "../interfaces/camera/ICamera";
import {type ICameraEngine} from "../interfaces/ICameraEngine";
import {AbstractCamera} from "./camera/AbstractCamera";
import {OrthographicCamera} from "./camera/OrthographicCamera";
import {PerspectiveCamera} from "./camera/PerspectiveCamera";
import {OrthographicCameraControls} from "./controls/OrthographicCameraControls";
import {PerspectiveCameraControls} from "./controls/PerspectiveCameraControls";

export class CameraEngine implements ICameraEngine {
	private readonly _cameraNode: ITreeNode = new TreeNode("cameras");
	private readonly _cameras: {
		[key: string]: ICamera;
	} = {};
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _tree: ITree = Tree.instance;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;
	private readonly _defaultCameraIds = [
		"top",
		"bottom",
		"left",
		"right",
		"front",
		"back",
	];

	private _camera: ICamera | null = null;
	private _loadDefaultCameras: boolean = true;
	private _settingsApplied: boolean = false;
	private _update?: () => void;

	protected _boundingBox: Box = new Box();

	constructor(private readonly _renderingEngine: IRenderingEngine) {
		this._tree.root.addChild(this._cameraNode);
		this._cameraNode.restrictViewports = [this._renderingEngine.id];

		this._eventEngine.addListener(
			EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
			(e: IEvent) => {
				const viewerEvent = <ISceneEvent>e;
				if (viewerEvent.viewportId === this._renderingEngine.id) {
					this._boundingBox = new Box(
						viewerEvent.boundingBox!.min,
						viewerEvent.boundingBox!.max,
					);

					const cameras = this.cameras;
					for (const c in cameras)
						cameras[c].boundingBox = this._boundingBox.clone();

					if (!this._boundingBox.isEmpty() && this.camera) {
						// check if the at least a part of the bounding box is visible
						// if not zoom to the bounding box
						if (
							!this.camera.boundingSphereVisible(
								this._boundingBox.boundingSphere,
							)
						) {
							this.camera.zoomTo(this._boundingBox, {
								duration: 0,
							});
						}
					}
				}
			},
		);

		this._eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			(e: IEvent) => {
				const viewerEvent = <ISceneEvent>e;
				if (viewerEvent.viewportId === this._renderingEngine.id) {
					this.searchForNewCameras();
				}
			},
		);
	}

	public get camera(): ICamera | null {
		return this._camera;
	}

	public get cameras(): {
		[key: string]: ICamera;
	} {
		return this._cameras;
	}

	public get loadDefaultCameras(): boolean {
		return this._loadDefaultCameras;
	}

	public set loadDefaultCameras(value: boolean) {
		this._loadDefaultCameras = value;

		if (value) {
			// if the default cameras are not yet created, we create them
			if (!this.hasDefaultCameras()) {
				this.createDefaultCameras(true, false);
			}
		} else {
			// check if there are currently default cameras and remove them
			if (this.hasDefaultCameras()) {
				for (const cameraId of this._defaultCameraIds) {
					if (this._cameras[cameraId]) this.removeCamera(cameraId);
				}

				// check if the current camera is one of the default cameras
				if (!this._camera) {
					// check if there are other cameras available
					const cameraKeys = Object.keys(this._cameras);
					if (cameraKeys.length > 0) {
						// if so, assign the first camera
						this.assignCamera(cameraKeys[0]);
					} else {
						// create the perspective camera if no cameras are available
						this.createDefaultCameras(false, true);
					}
				} else {
					// if the current camera is one of the default cameras, we need to assign a new camera
					if (this._defaultCameraIds.includes(this._camera.id)) {
						// if the current camera is one of the default cameras, assign the first camera
						const cameraKeys = Object.keys(this._cameras);
						if (cameraKeys.length > 0) {
							this.assignCamera(cameraKeys[0]);
						} else {
							// create the perspective camera if no cameras are available
							this.createDefaultCameras(false, true);
						}
					}
				}
			}
		}
	}

	public get update(): (() => void) | undefined {
		return this._update;
	}

	public set update(value: (() => void) | undefined) {
		this._update = value;
	}

	public activateCameraEvents(): void {
		const cameras = this.cameras;
		for (const c in cameras)
			(<PerspectiveCameraControls | OrthographicCameraControls>(
				cameras[c].controls
			)).cameraControlsEventDistribution.activateCameraEvents();
	}

	public hasDefaultCameras(): boolean {
		let defaultCamerasInSettings = true;

		for (const cameraId of this._defaultCameraIds) {
			if (!this._cameras[cameraId]) {
				defaultCamerasInSettings = false;
				break;
			}
		}
		return defaultCamerasInSettings;
	}

	public applySettings(settingsEngine: SettingsEngine) {
		const cameras = this.cameras;
		for (const c in cameras) this.removeCamera(c);

		/**
		 * Due to some inconsistency in the behavior of saving settings
		 * we save the orthographic default cameras, even if they were never changed.
		 * Now we check if the six cameras exist and were not change and if so, we never add them
		 */
		let defaultCamerasInSettings = true;

		for (const cameraId of this._defaultCameraIds) {
			if (settingsEngine.settings.camera.cameraId === cameraId) {
				// the camera was set as the default, don't remove it
				defaultCamerasInSettings = false;
				break;
			}

			if (!settingsEngine.settings.camera.cameras[cameraId])
				defaultCamerasInSettings = false;
		}

		for (const id in settingsEngine.settings.camera.cameras) {
			const cameraSetting = settingsEngine.settings.camera.cameras[id];
			if (cameraSetting.type === "perspective") {
				this.createCamera(CAMERA_TYPE.PERSPECTIVE, id);
			} else {
				const isDefault =
					defaultCamerasInSettings &&
					this._defaultCameraIds.includes(id);
				const camera = this.createCamera(
					CAMERA_TYPE.ORTHOGRAPHIC,
					id,
					isDefault,
				);
				(<OrthographicCamera>camera).direction =
					cameraSetting.type as ORTHOGRAPHIC_CAMERA_DIRECTION;
			}
		}

		for (const c in cameras) cameras[c].applySettings(settingsEngine);

		this._loadDefaultCameras =
			settingsEngine.settings.camera.loadDefaultCameras;

		const cameraKeys = Object.keys(settingsEngine.settings.camera.cameras);

		if (cameraKeys.length > 0) {
			if (!settingsEngine.settings.camera.cameraId) {
				this.assignCamera(cameraKeys[0]);
			} else {
				this.assignCamera(settingsEngine.settings.camera.cameraId);
			}

			// create the default orthographic cameras if there are no cameras with the default names
			if (
				!defaultCamerasInSettings &&
				cameraKeys.every((key) => !this._defaultCameraIds.includes(key))
			)
				this.createDefaultCameras(this._loadDefaultCameras, false);
		} else {
			this.createDefaultCameras(this._loadDefaultCameras, true);
			this.camera!.applySettings(settingsEngine);
		}

		this._settingsApplied = true;

		// If the camera is set to auto adjust, we call zoomTo once when the bounding box is available
		// this is needed as the default position and target might not make sense if the model is loaded with a different modelState
		// or different initial parameters
		const sessionObj = Object.values(this._stateEngine.sessionEngines).find(
			(s) => s?.settingsEngine === settingsEngine,
		);
		const zoomTo =
			!!sessionObj?.sessionCreationDefinition.initialParameterValues ||
			!!sessionObj?.sessionCreationDefinition.modelStateId;
		if (
			(zoomTo && this.camera?.autoAdjust) ||
			this.camera?.initialAutoAdjust ||
			this._renderingEngine.viewportCreationDefinition.initialAutoAdjust
		) {
			// Use boundingBoxCreated which resolves immediately if the scene
			// is already loaded (session-first), or once it appears (viewport-first).
			this._stateEngine.viewportEngines[
				this._renderingEngine.id
			]?.boundingBoxCreated.then(() => {
				this.camera?.zoomTo(undefined, {duration: 0});
			});
		}

		if (this.camera?.autoAdjust) {
			// Default: zoom only if the camera cannot see any part of the scene.
			const token = this._eventEngine.addListener(
				EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE,
				(e: IEvent) => {
					const viewerEvent = <ISceneEvent>e;
					if (viewerEvent.viewportId === this._renderingEngine.id) {
						this._boundingBox = new Box(
							viewerEvent.boundingBox!.min,
							viewerEvent.boundingBox!.max,
						);
						if (this._boundingBox.isEmpty() || !this.camera) return;

						if (
							!this.camera.boundingSphereVisible(
								this._boundingBox.boundingSphere,
							)
						) {
							this.camera.zoomTo(this._boundingBox, {
								duration: 0,
							});
						}

						this._eventEngine.removeListener(token);
					}
				},
			);
		}

		if (this._update) this._update();
	}

	public assignCamera(id: string): boolean {
		const camera = this.cameras[id];
		if (!camera) return false;

		for (const c in this.cameras) this.cameras[c].active = false;

		this._camera = camera;
		this._camera.active = true;
		return true;
	}

	public close(): void {
		this._tree.root.removeChild(this._cameraNode);
	}

	public createCamera(
		type: CAMERA_TYPE,
		id?: string,
		isDefault: boolean = false,
	): ICamera {
		const cameras = this.cameras;
		const cameraId = id || this._uuidGenerator.create();
		if (cameras[cameraId])
			throw new ShapeDiverViewerCameraError(
				`CameraEngine.createCamera: Camera (${type}) with this id (${cameraId}) already exists.`,
			);

		const initialAspectRatio =
			(<HTMLDivElement>this._renderingEngine.canvas.parentNode)
				.clientWidth /
			(<HTMLDivElement>this._renderingEngine.canvas.parentNode)
				.clientHeight;
		const camera =
			CAMERA_TYPE.PERSPECTIVE === type
				? new PerspectiveCamera(
						cameraId,
						undefined,
						initialAspectRatio,
						isDefault,
					)
				: new OrthographicCamera(cameraId, undefined, isDefault);
		camera.assignViewer(this._renderingEngine);

		cameras[cameraId] = camera;
		if (this._settingsApplied && this._renderingEngine.settingsEngine) {
			camera.applySettings(this._renderingEngine.settingsEngine);
		} else {
			camera.zoomTo(undefined, {duration: 0});
		}

		this._cameraNode.addData(camera);
		if (this._update) this._update();
		return camera;
	}

	public createDefaultCameras(
		createOrthographic: boolean = true,
		createPerspective: boolean = true,
	): void {
		if (createOrthographic) {
			const topCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "top", true)
			);
			topCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
			const bottomCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "bottom", true)
			);
			bottomCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM;
			const leftCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "left", true)
			);
			leftCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT;
			const rightCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "right", true)
			);
			rightCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT;
			const frontCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "front", true)
			);
			frontCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT;
			const backCamera = <OrthographicCamera>(
				this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, "back", true)
			);
			backCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BACK;
		}
		if (createPerspective) {
			const camera = this.createCamera(
				CAMERA_TYPE.PERSPECTIVE,
				"perspective",
			);
			this.assignCamera(camera.id);
		}
	}

	public deactivateCameraEvents(): void {
		const cameras = this.cameras;
		for (const c in cameras)
			(<PerspectiveCameraControls | OrthographicCameraControls>(
				cameras[c].controls
			)).cameraControlsEventDistribution.deactivateCameraEvents();
	}

	public removeCamera(id: string): boolean {
		const cameras = this.cameras;
		const camera = cameras[id];
		if (!camera) return false;
		camera.destroy();
		if (camera.domEventListenerToken)
			this._renderingEngine.domEventEngine.removeDomEventListener(
				camera.domEventListenerToken,
			);
		if (this._camera && this._camera.id === id) this._camera = null;

		delete cameras[id];
		this._cameraNode.removeData(camera);
		if (this._update) this._update();
		return true;
	}

	public saveSettings(settingsEngine: SettingsEngine) {
		settingsEngine.camera.loadDefaultCameras = this._loadDefaultCameras;
		settingsEngine.settings.camera.cameraId = this._camera
			? this._camera.id
			: "perspective";
		settingsEngine.settings.camera.cameras = {};

		for (const c in this.cameras) {
			const camera = this.cameras[c];

			// don't save the default cameras
			if (camera.isDefault) continue;

			if (camera.type === CAMERA_TYPE.PERSPECTIVE) {
				const controls = <PerspectiveCameraControls>(
					(<PerspectiveCamera>camera).controls
				);
				settingsEngine.camera.cameras[camera.id] = {
					name: camera.name,
					autoAdjust: camera.autoAdjust,
					cameraMovementDuration: camera.cameraMovementDuration,
					enableCameraControls: camera.enableCameraControls,
					initialAutoAdjust: camera.initialAutoAdjust,
					revertAtMouseUp: camera.revertAtMouseUp,
					revertAtMouseUpDuration: camera.revertAtMouseUpDuration,
					zoomExtentsFactor: camera.zoomExtentsFactor,
					position: {
						x: camera.defaultPosition[0],
						y: camera.defaultPosition[1],
						z: camera.defaultPosition[2],
					},
					target: {
						x: camera.defaultTarget[0],
						y: camera.defaultTarget[1],
						z: camera.defaultTarget[2],
					},
					type: camera.type,
					fov: (<PerspectiveCamera>camera).fov,
					sceneRotation: {
						x: (<PerspectiveCamera>camera).sceneRotation[0],
						y: (<PerspectiveCamera>camera).sceneRotation[1],
					},
					controls: {
						autoRotationSpeed: controls.autoRotationSpeed,
						damping: controls.damping,
						enableAutoRotation: controls.enableAutoRotation,
						enableKeyPan: controls.enableKeyPan,
						enablePan: controls.enablePan,
						enableRotation: controls.enableRotation,
						enableZoom: controls.enableZoom,
						input: controls.input,
						keyPanSpeed: controls.keyPanSpeed,
						movementSmoothness: controls.movementSmoothness,
						rotationSpeed: controls.rotationSpeed,
						panSpeed: controls.panSpeed,
						zoomSpeed: controls.zoomSpeed,
						restrictions: {
							position: {
								cube: {
									min: {
										x: controls.cubePositionRestriction
											.min[0],
										y: controls.cubePositionRestriction
											.min[1],
										z: controls.cubePositionRestriction
											.min[2],
									},
									max: {
										x: controls.cubePositionRestriction
											.max[0],
										y: controls.cubePositionRestriction
											.max[1],
										z: controls.cubePositionRestriction
											.max[2],
									},
								},
								sphere: {
									center: {
										x: controls.spherePositionRestriction
											.center[0],
										y: controls.spherePositionRestriction
											.center[1],
										z: controls.spherePositionRestriction
											.center[2],
									},
									radius: controls.spherePositionRestriction
										.radius,
								},
							},
							target: {
								cube: {
									min: {
										x: controls.cubeTargetRestriction
											.min[0],
										y: controls.cubeTargetRestriction
											.min[1],
										z: controls.cubeTargetRestriction
											.min[2],
									},
									max: {
										x: controls.cubeTargetRestriction
											.max[0],
										y: controls.cubeTargetRestriction
											.max[1],
										z: controls.cubeTargetRestriction
											.max[2],
									},
								},
								sphere: {
									center: {
										x: controls.sphereTargetRestriction
											.center[0],
										y: controls.sphereTargetRestriction
											.center[1],
										z: controls.sphereTargetRestriction
											.center[2],
									},
									radius: controls.sphereTargetRestriction
										.radius,
								},
							},
							rotation: controls.rotationRestriction,
							zoom: controls.zoomRestriction,
						},
						enableAzimuthRotation: controls.enableAzimuthRotation,
						enablePolarRotation: controls.enablePolarRotation,
						enableObjectControls: controls.enableObjectControls,
						enableTurntableControls:
							controls.enableTurntableControls,
						turntableCenter: {
							x: controls.turntableCenter[0],
							y: controls.turntableCenter[1],
							z: controls.turntableCenter[2],
						},
						objectControlsCenter: {
							x: controls.objectControlsCenter[0],
							y: controls.objectControlsCenter[1],
							z: controls.objectControlsCenter[2],
						},
					},
				};
			} else {
				if (settingsEngine.camera.cameras[camera.id]) {
					const previousDirection =
						settingsEngine.camera.cameras[camera.id].type;

					// if the direction changed, but the default position & target did not, there is an issue
					if (
						previousDirection !== camera.type &&
						settingsEngine.camera.cameras[camera.id].position.x ===
							camera.defaultPosition[0] &&
						settingsEngine.camera.cameras[camera.id].position.y ===
							camera.defaultPosition[1] &&
						settingsEngine.camera.cameras[camera.id].position.z ===
							camera.defaultPosition[2] &&
						settingsEngine.camera.cameras[camera.id].target.x ===
							camera.defaultTarget[0] &&
						settingsEngine.camera.cameras[camera.id].target.y ===
							camera.defaultTarget[1] &&
						settingsEngine.camera.cameras[camera.id].target.z ===
							camera.defaultTarget[2]
					) {
						camera.defaultPosition = vec3.clone(camera.position);
						camera.defaultTarget = vec3.clone(camera.target);
					}
				}
				const controls = <OrthographicCameraControls>(
					(<OrthographicCamera>camera).controls
				);

				settingsEngine.camera.cameras[camera.id] = {
					name: camera.name,
					autoAdjust: camera.autoAdjust,
					cameraMovementDuration: camera.cameraMovementDuration,
					enableCameraControls: camera.enableCameraControls,
					initialAutoAdjust: camera.initialAutoAdjust,
					revertAtMouseUp: camera.revertAtMouseUp,
					revertAtMouseUpDuration: camera.revertAtMouseUpDuration,
					zoomExtentsFactor: camera.zoomExtentsFactor,
					position: {
						x: camera.defaultPosition[0],
						y: camera.defaultPosition[1],
						z: camera.defaultPosition[2],
					},
					target: {
						x: camera.defaultTarget[0],
						y: camera.defaultTarget[1],
						z: camera.defaultTarget[2],
					},
					type: (<OrthographicCamera>camera).direction,
					sceneRotation: {
						x: (<OrthographicCamera>camera).sceneRotation[0],
						y: (<OrthographicCamera>camera).sceneRotation[1],
					},
					controls: {
						autoRotationSpeed: controls.autoRotationSpeed,
						damping: controls.damping,
						enableAutoRotation: controls.enableAutoRotation,
						enableKeyPan: controls.enableKeyPan,
						enablePan: controls.enablePan,
						enableRotation: controls.enableRotation,
						enableZoom: controls.enableZoom,
						input: controls.input,
						keyPanSpeed: controls.keyPanSpeed,
						movementSmoothness: controls.movementSmoothness,
						rotationSpeed: controls.rotationSpeed,
						panSpeed: controls.panSpeed,
						zoomSpeed: controls.zoomSpeed,
						restrictions: {
							position: {
								cube: {
									min: {
										x: controls.cubePositionRestriction
											.min[0],
										y: controls.cubePositionRestriction
											.min[1],
										z: controls.cubePositionRestriction
											.min[2],
									},
									max: {
										x: controls.cubePositionRestriction
											.max[0],
										y: controls.cubePositionRestriction
											.max[1],
										z: controls.cubePositionRestriction
											.max[2],
									},
								},
								sphere: {
									center: {
										x: controls.spherePositionRestriction
											.center[0],
										y: controls.spherePositionRestriction
											.center[1],
										z: controls.spherePositionRestriction
											.center[2],
									},
									radius: controls.spherePositionRestriction
										.radius,
								},
							},
							target: {
								cube: {
									min: {
										x: controls.cubeTargetRestriction
											.min[0],
										y: controls.cubeTargetRestriction
											.min[1],
										z: controls.cubeTargetRestriction
											.min[2],
									},
									max: {
										x: controls.cubeTargetRestriction
											.max[0],
										y: controls.cubeTargetRestriction
											.max[1],
										z: controls.cubeTargetRestriction
											.max[2],
									},
								},
								sphere: {
									center: {
										x: controls.sphereTargetRestriction
											.center[0],
										y: controls.sphereTargetRestriction
											.center[1],
										z: controls.sphereTargetRestriction
											.center[2],
									},
									radius: controls.sphereTargetRestriction
										.radius,
								},
							},
							rotation: controls.rotationRestriction,
							zoom: controls.zoomRestriction,
						},
						enableAzimuthRotation: controls.enableAzimuthRotation,
						enablePolarRotation: controls.enablePolarRotation,
						enableObjectControls: controls.enableObjectControls,
						enableTurntableControls:
							controls.enableTurntableControls,
						turntableCenter: {
							x: controls.turntableCenter[0],
							y: controls.turntableCenter[1],
							z: controls.turntableCenter[2],
						},
						objectControlsCenter: {
							x: controls.objectControlsCenter[0],
							y: controls.objectControlsCenter[1],
							z: controls.objectControlsCenter[2],
						},
					},
				};
			}
		}
	}

	private searchForNewCameras() {
		const getCameraData = (node: ITreeNode) => {
			for (let i = 0; i < node.data.length; i++)
				if (
					node.data[i] instanceof AbstractCamera &&
					!this._cameras[node.data[i].id]
				) {
					const camera = <AbstractCamera>node.data[i];
					if (camera.viewportId === this._renderingEngine.id)
						this._cameras[camera.id] = camera;
				}

			for (let i = 0; i < node.children.length; i++)
				getCameraData(node.children[i]);
		};
		getCameraData(this._tree.root);
		if (this._update) this._update();
	}
}
