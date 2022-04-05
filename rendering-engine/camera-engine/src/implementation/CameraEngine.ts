import {
  DomEventEngine,
  EventEngine,
  EVENTTYPE,
  IEvent,
  Logger,
  LOGGINGTOPIC,
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
import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'

import { CAMERATYPE, ICameraEngine } from '../interfaces/ICameraEngine'
import { AbstractCamera, AbstractCamera as Camera } from './camera/AbstractCamera'
import { OrthographicCameraControls } from './controls/OrthographicCameraControls'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCameraControls } from './controls/PerspectiveCameraControls'
import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '../interfaces/camera/IOrthographicCamera'

export class CameraEngine implements ICameraEngine {
    // #region Properties (10)

    private readonly _cameras: {
        [key: string]: Camera
    } = {};
    private readonly _camerasDomEventListenerToken: {
        [key: string]: string
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _camera: Camera | null = null;
    private _settingsApplied: boolean = false;

    protected _boundingBox: Box = new Box();

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(private readonly _viewerId: string, private readonly _canvas: HTMLCanvasElement, private readonly _domEventEngine: DomEventEngine) {
        this._eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e: IEvent) => {
            const viewerEvent = <ISceneEvent>e;
            if (viewerEvent.viewerId === this._viewerId) {
                this._boundingBox = new Box(viewerEvent.boundingBox!.min, viewerEvent.boundingBox!.max);

                const cameras = this.cameras;
                for (let c in cameras)
                    cameras[c].boundingBox = this._boundingBox.clone();
            }
        });

        this._eventEngine.addListener(EVENTTYPE.VIEWER.VIEWER_UPDATED, (e: IEvent) => {
            const viewerEvent = <ISceneEvent>e;
            if (viewerEvent.viewerId === this._viewerId) {
                this.searchForNewCameras();
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get camera(): Camera | null {
        return this._camera;
    }

    public get cameras(): {
        [key: string]: Camera
    } {
        this.searchForNewCameras();
        return this._cameras;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (7)

    public activateCameraEvents(): void {
        const cameras = this.cameras;
        for(let c in cameras)
            (<PerspectiveCameraControls | OrthographicCameraControls>cameras[c].controls).cameraControlsEventDistribution.activateCameraEvents();
    }

    public applySettings() {
        const cameras = this.cameras;
        for (let c in cameras)
            this.removeCamera(c);

        for(let id in this._settingsEngine.settings.camera.cameras) {
            const cameraSetting = this._settingsEngine.settings.camera.cameras[id];
            if(cameraSetting.type === 'perspective') {
                this.createCamera(CAMERATYPE.PERSPECTIVE, id);
            } else {
                const camera = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
                (<OrthographicCamera>camera).direction = <ORTHOGRAPHIC_CAMERA_DIRECTION>cameraSetting.type;
            }
        }

        if(!this._settingsApplied)
            for (let c in cameras)
                cameras[c].applySettings();

        const cameraKeys = Object.keys(this._settingsEngine.settings.camera.cameras);

        if(cameraKeys.length > 0) {
            if(!this._settingsEngine.settings.camera.cameraId) {
                this.assignCamera(cameraKeys[0]);
            } else {
                this.assignCamera(this._settingsEngine.settings.camera.cameraId);
            }
        } else {
            const camera = this.createCamera(CAMERATYPE.PERSPECTIVE, 'standard');
            this.assignCamera(camera.id);
            camera.applySettings();
        }

        this._settingsApplied = true;
    }

    public assignCamera(id: string): void {
        const camera = this.cameras[id];
        if (!camera) return;
        this._camera = camera;
    }

    public createCamera(type: CAMERATYPE, id?: string): Camera {
        const cameras = this.cameras;
        const cameraId = id || this._uuidGenerator.create();
        if (cameras[cameraId]) {
            const error = new ShapeDiverViewerCameraError(`CameraEngine.createCamera: Camera (${type}) with this id (${cameraId}) already exists.`);
            throw this._logger.handleError(LOGGINGTOPIC.CAMERA, `CameraEngine.createCamera`, error);
        }
        
        const camera = CAMERATYPE.PERSPECTIVE === type ? new PerspectiveCamera(cameraId) : new OrthographicCamera(cameraId);
        camera.assignViewer(this._viewerId);

        cameras[cameraId] = camera;
        if (this._settingsApplied) {
            camera.applySettings();
        } else {
            camera.zoomTo(undefined, { duration: 0 });
        }

        return camera;
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
        this._domEventEngine.removeDomEventListener(this._camerasDomEventListenerToken[id])
        if (this._camera && this._camera.id === id)
            this._camera = null;

        delete cameras[id];
        delete this._camerasDomEventListenerToken[id];
        return true;
    }

    public saveSettings() {
        this._settingsEngine.settings.camera.cameraId = this._camera ? this._camera.id : 'standard';
        this._settingsEngine.settings.camera.cameras = {};

        // TODO: once the platform is ready for it, save all cameras
        // for (let c in this.cameras) {
        if(!this._camera) 
            return;

        const camera = this._camera;

        if (camera.type === CAMERATYPE.PERSPECTIVE) {
            const controls = <PerspectiveCameraControls>(<PerspectiveCamera>camera).controls;
            this._settingsEngine.camera.cameras[camera.id] = {
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
            if (this._settingsEngine.camera.cameras[camera.id]) {
                const previousDirection = this._settingsEngine.camera.cameras[camera.id].type;

                // if the direction changed, but the default position & target did not, there is an issue
                if (previousDirection !== camera.type && (
                    this._settingsEngine.camera.cameras[camera.id].position.x === camera.defaultPosition[0] &&
                    this._settingsEngine.camera.cameras[camera.id].position.y === camera.defaultPosition[1] &&
                    this._settingsEngine.camera.cameras[camera.id].position.z === camera.defaultPosition[2] &&
                    this._settingsEngine.camera.cameras[camera.id].target.x === camera.defaultTarget[0] &&
                    this._settingsEngine.camera.cameras[camera.id].target.y === camera.defaultTarget[1] &&
                    this._settingsEngine.camera.cameras[camera.id].target.z === camera.defaultTarget[2]
                )) {
                    camera.defaultPosition = vec3.clone(camera.position);
                    camera.defaultTarget = vec3.clone(camera.target);
                }
            }
            const controls = <OrthographicCameraControls>(<OrthographicCamera>camera).controls;

            this._settingsEngine.camera.cameras[camera.id] = {
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

    // #endregion Public Methods (7)
    
    // #region Private Methods (1)

    private searchForNewCameras() {
        const getCameraData = (node: TreeNode) => {
            for(let i = 0; i < node.data.length; i++)
                if((node.data[i] instanceof AbstractCamera) && !this._cameras[node.data[i].id]) {
                    const camera = <AbstractCamera>node.data[i];
                    if(camera.viewerId === this._viewerId)
                        this._cameras[camera.id] = camera;
                }

            for(let i = 0; i < node.children.length; i++)
                getCameraData(node.children[i]);
        };
        getCameraData(this._tree.root);
    }

    // #endregion Private Methods (1)
}