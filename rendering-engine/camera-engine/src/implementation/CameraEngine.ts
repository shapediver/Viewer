import {
  DomEventEngine,
  EventEngine,
  EVENTTYPE,
  IEvent,
  Logger,
  LOGGING_TOPIC,
  SettingsEngine,
  ShapeDiverViewerCameraError,
  StateEngine,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { container, singleton } from 'tsyringe'
import { Box } from '@shapediver/viewer.shared.math'
import { vec3 } from 'gl-matrix'
import { IOrthographicCameraSettingsV3, IPerspectiveCameraSettingsV3 } from '@shapediver/viewer.settings'
import { ISceneEvent } from '@shapediver/viewer.shared.types'
import { ITree, ITreeNode, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'

import { CAMERA_TYPE, ICameraEngine } from '../interfaces/ICameraEngine'
import { AbstractCamera } from './camera/AbstractCamera'
import { OrthographicCameraControls } from './controls/OrthographicCameraControls'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCameraControls } from './controls/PerspectiveCameraControls'
import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '../interfaces/camera/IOrthographicCamera'
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { ICamera } from '../interfaces/camera/ICamera'

export class CameraEngine implements ICameraEngine {
    // #region Properties (10)

    private readonly _cameras: {
        [key: string]: ICamera
    } = {};
    private readonly _camerasDomEventListenerToken: {
        [key: string]: string
    } = {};
    private readonly _cameraNode: ITreeNode = new TreeNode('cameras');
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: ITree = <ITree>container.resolve(Tree);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _camera: ICamera | null = null;
    private _settingsApplied: boolean = false;

    protected _boundingBox: Box = new Box();
    private _update?: () => void;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: IRenderingEngine, private readonly _canvas: HTMLCanvasElement) {
        this._tree.root.addChild(this._cameraNode);
        this._cameraNode.restrictViewports = [this._renderingEngine.id];
        
        this._eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e: IEvent) => {
            const viewerEvent = <ISceneEvent>e;
            if (viewerEvent.viewportId === this._renderingEngine.id) {
                this._boundingBox = new Box(viewerEvent.boundingBox!.min, viewerEvent.boundingBox!.max);

                const cameras = this.cameras;
                for (let c in cameras)
                    cameras[c].boundingBox = this._boundingBox.clone();
            }
        });

        this._eventEngine.addListener(EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (e: IEvent) => {
            const viewerEvent = <ISceneEvent>e;
            if (viewerEvent.viewportId === this._renderingEngine.id) {
                this.searchForNewCameras();
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get camera(): ICamera | null {
        return this._camera;
    }

    public get cameras(): {
        [key: string]: ICamera
    } {
        return this._cameras;
    }
    
    public get update(): (() => void) | undefined {
        return this._update;
    }

    public set update(value: (() => void) | undefined) {
        this._update = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (7)

    public activateCameraEvents(): void {
        const cameras = this.cameras;
        for(let c in cameras)
            (<PerspectiveCameraControls | OrthographicCameraControls>cameras[c].controls).cameraControlsEventDistribution.activateCameraEvents();
    }

    public applySettings(settingsEngine: SettingsEngine) {
        const cameras = this.cameras;
        for (let c in cameras)
            this.removeCamera(c);

        for(let id in settingsEngine.settings.camera.cameras) {
            const cameraSetting = settingsEngine.settings.camera.cameras[id];
            if(cameraSetting.type === 'perspective') {
                this.createCamera(CAMERA_TYPE.PERSPECTIVE, id);
            } else {
                const camera = this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, id);
                (<OrthographicCamera>camera).direction = <ORTHOGRAPHIC_CAMERA_DIRECTION>cameraSetting.type;
            }
        }

        if(!this._settingsApplied)
            for (let c in cameras)
                cameras[c].applySettings(settingsEngine);

        const cameraKeys = Object.keys(settingsEngine.settings.camera.cameras);

        if(cameraKeys.length > 0) {
            if(!settingsEngine.settings.camera.cameraId) {
                this.assignCamera(cameraKeys[0]);
            } else {
                this.assignCamera(settingsEngine.settings.camera.cameraId);
            }
        } else {
            this.createDefaultCameras();
            this.camera!.applySettings(settingsEngine);
        }

        this._settingsApplied = true;
        if(this._update) this._update();
    }

    public assignCamera(id: string): boolean {
        const camera = this.cameras[id];
        if (!camera) return false;

        for (let c in this.cameras)
            this.cameras[c].active = false;

        this._camera = camera;
        this._camera.active = true;
        return true;
    }

    public createCamera(type: CAMERA_TYPE, id?: string): ICamera {
        const cameras = this.cameras;
        const cameraId = id || this._uuidGenerator.create();
        if (cameras[cameraId]) {
            const error = new ShapeDiverViewerCameraError(`CameraEngine.createCamera: Camera (${type}) with this id (${cameraId}) already exists.`);
            throw this._logger.handleError(LOGGING_TOPIC.CAMERA, `CameraEngine.createCamera`, error, false);
        }
        
        const camera = CAMERA_TYPE.PERSPECTIVE === type ? new PerspectiveCamera(cameraId) : new OrthographicCamera(cameraId);
        camera.assignViewer(this._renderingEngine.id);

        cameras[cameraId] = camera;
        if (this._settingsApplied && this._renderingEngine.settingsEngine) {
            camera.applySettings(this._renderingEngine.settingsEngine);
        } else {
            camera.zoomTo(undefined, { duration: 0 });
        }

        this._cameraNode.addData(camera);
        if(this._update) this._update();
        return camera;
    }

    public createDefaultCameras(): void {
        const topCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'top');
        topCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
        const bottomCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'bottom');
        bottomCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM;
        const leftCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'left');
        leftCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT;
        const rightCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'right');
        rightCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT;
        const frontCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'front');
        frontCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT;
        const backCamera = <OrthographicCamera>this.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, 'back');
        backCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BACK;
        const camera = this.createCamera(CAMERA_TYPE.PERSPECTIVE, 'perspective');
        this.assignCamera(camera.id);
    }

    public deactivateCameraEvents(): void {
        const cameras = this.cameras;
        for (let c in cameras)
            (<PerspectiveCameraControls | OrthographicCameraControls>cameras[c].controls).cameraControlsEventDistribution.deactivateCameraEvents();
    }

    public removeCamera(id: string): boolean {
        const cameras = this.cameras;
        const camera = cameras[id];
        if (!camera) return false;
        this._renderingEngine.domEventEngine.removeDomEventListener(this._camerasDomEventListenerToken[id])
        if (this._camera && this._camera.id === id)
            this._camera = null;

        delete cameras[id];
        delete this._camerasDomEventListenerToken[id];
        this._cameraNode.removeData(camera);
        if(this._update) this._update();
        return true;
    }

    public saveSettings(settingsEngine: SettingsEngine) {
        settingsEngine.settings.camera.cameraId = this._camera ? this._camera.id : 'perspective';
        settingsEngine.settings.camera.cameras = {};

        for (let c in this.cameras) {
            const camera = this.cameras[c];

            if (camera.type === CAMERA_TYPE.PERSPECTIVE) {
                const controls = <PerspectiveCameraControls>(<PerspectiveCamera>camera).controls;
                settingsEngine.camera.cameras[camera.id] = {
                    name: camera.name,
                    autoAdjust: camera.autoAdjust,
                    cameraMovementDuration: camera.cameraMovementDuration,
                    enableCameraControls: camera.enableCameraControls,
                    revertAtMouseUp: camera.revertAtMouseUp,
                    revertAtMouseUpDuration: camera.revertAtMouseUpDuration,
                    zoomExtentsFactor: camera.zoomExtentsFactor,
                    position: { x: camera.defaultPosition[0], y: camera.defaultPosition[1], z: camera.defaultPosition[2] },
                    target: { x: camera.defaultTarget[0], y: camera.defaultTarget[1], z: camera.defaultTarget[2] },
                    type: camera.type,
                    fov: (<PerspectiveCamera>camera).fov,
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
                                    min: { x: controls.cubePositionRestriction.min[0], y: controls.cubePositionRestriction.min[1], z: controls.cubePositionRestriction.min[2] },
                                    max: { x: controls.cubePositionRestriction.max[0], y: controls.cubePositionRestriction.max[1], z: controls.cubePositionRestriction.max[2] },
                                },
                                sphere: {
                                    center: { x: controls.spherePositionRestriction.center[0], y: controls.spherePositionRestriction.center[1], z: controls.spherePositionRestriction.center[2] },
                                    radius: controls.spherePositionRestriction.radius,
                                },
                            },
                            target: {
                                cube: {
                                    min: { x: controls.cubeTargetRestriction.min[0], y: controls.cubeTargetRestriction.min[1], z: controls.cubeTargetRestriction.min[2] },
                                    max: { x: controls.cubeTargetRestriction.max[0], y: controls.cubeTargetRestriction.max[1], z: controls.cubeTargetRestriction.max[2] },
                                },
                                sphere: {
                                    center: { x: controls.sphereTargetRestriction.center[0], y: controls.sphereTargetRestriction.center[1], z: controls.sphereTargetRestriction.center[2] },
                                    radius: controls.sphereTargetRestriction.radius,
                                },
                            },
                            rotation: controls.rotationRestriction,
                            zoom: controls.zoomRestriction,
                        }
                    }
                }
    
            } else {
                if (settingsEngine.camera.cameras[camera.id]) {
                    const previousDirection = settingsEngine.camera.cameras[camera.id].type;
    
                    // if the direction changed, but the default position & target did not, there is an issue
                    if (previousDirection !== camera.type && (
                        settingsEngine.camera.cameras[camera.id].position.x === camera.defaultPosition[0] &&
                        settingsEngine.camera.cameras[camera.id].position.y === camera.defaultPosition[1] &&
                        settingsEngine.camera.cameras[camera.id].position.z === camera.defaultPosition[2] &&
                        settingsEngine.camera.cameras[camera.id].target.x === camera.defaultTarget[0] &&
                        settingsEngine.camera.cameras[camera.id].target.y === camera.defaultTarget[1] &&
                        settingsEngine.camera.cameras[camera.id].target.z === camera.defaultTarget[2]
                    )) {
                        camera.defaultPosition = vec3.clone(camera.position);
                        camera.defaultTarget = vec3.clone(camera.target);
                    }
                }
                const controls = <OrthographicCameraControls>(<OrthographicCamera>camera).controls;
    
                settingsEngine.camera.cameras[camera.id] = {
                    name: camera.name,
                    autoAdjust: camera.autoAdjust,
                    cameraMovementDuration: camera.cameraMovementDuration,
                    enableCameraControls: camera.enableCameraControls,
                    revertAtMouseUp: camera.revertAtMouseUp,
                    revertAtMouseUpDuration: camera.revertAtMouseUpDuration,
                    zoomExtentsFactor: camera.zoomExtentsFactor,
                    position: { x: camera.defaultPosition[0], y: camera.defaultPosition[1], z: camera.defaultPosition[2] },
                    target: { x: camera.defaultTarget[0], y: camera.defaultTarget[1], z: camera.defaultTarget[2] },
                    type: (<OrthographicCamera>camera).direction,
                    controls: {
                        damping: controls.damping,
                        enableKeyPan: controls.enableKeyPan,
                        enablePan: controls.enablePan,
                        enableZoom: controls.enableZoom,
                        input: controls.input,
                        keyPanSpeed: controls.keyPanSpeed,
                        movementSmoothness: controls.movementSmoothness,
                        panSpeed: controls.panSpeed,
                        zoomSpeed: controls.zoomSpeed,
                    }
                }
            }
        }
    }

    // #endregion Public Methods (7)
    
    // #region Private Methods (1)

    private searchForNewCameras() {
        const getCameraData = (node: ITreeNode) => {
            for(let i = 0; i < node.data.length; i++)
                if((node.data[i] instanceof AbstractCamera) && !this._cameras[node.data[i].id]) {
                    const camera = <AbstractCamera>node.data[i];
                    if(camera.viewportId === this._renderingEngine.id)
                        this._cameras[camera.id] = camera;
                }

            for(let i = 0; i < node.children.length; i++)
                getCameraData(node.children[i]);
        };
        getCameraData(this._tree.root);
        if(this._update) this._update();
    }

    // #endregion Private Methods (1)
}