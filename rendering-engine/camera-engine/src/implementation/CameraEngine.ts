import { DomEventEngine, EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { SDError, UuidGenerator } from '@shapediver/viewer.shared.utils'
import { container, singleton } from 'tsyringe'
import { ICanvas } from '@shapediver/viewer.rendering-engine.canvas-engine'
import { Box } from '@shapediver/viewer.shared.math'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

import { CAMERATYPE, ICameraEngine } from '../interfaces/ICameraEngine'
import { AbstractCamera as Camera } from './camera/AbstractCamera'
import { OrthographicCameraControls } from './controls/OrthographicCameraControls'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCameraControls } from './controls/PerspectiveCameraControls'
import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '../interfaces/camera/IOrthographicCamera'

export class CameraEngine implements ICameraEngine {
    // #region Properties (3)

    private readonly _cameras: {
        [key: string]: Camera
    } = {};
    private readonly _camerasDomEventListenerToken: {
        [key: string]: string
    } = {};
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    protected _boundingBox: Box = new Box();

    private _camera: Camera | null = null;
    private _settingsApplied: boolean = false;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _canvas: ICanvas, private readonly _domEventEngine: DomEventEngine) {        
        this._eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (bb: any) => {
            this._boundingBox = bb.clone()
            
            for (let c in this._cameras)
                this._cameras[c].boundingBox = bb.clone();
        });
    }

    public applySettings() {
        switch (this._settingsEngine.camera.cameraTypes.active.value) {
            case 1:
                const cameraTop = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardTop');
                (<OrthographicCamera>cameraTop).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
                this.assignCamera(cameraTop.id);
                break;
            case 2:
                const cameraBottom = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardBottom');
                (<OrthographicCamera>cameraBottom).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM;
                this.assignCamera(cameraBottom.id);
                break;
            case 3:
                const cameraRight = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardRight');
                (<OrthographicCamera>cameraRight).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT;
                this.assignCamera(cameraRight.id);
                break;
            case 4:
                const cameraLeft = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardLeft');
                (<OrthographicCamera>cameraLeft).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT;
                this.assignCamera(cameraLeft.id);
                break;
            case 5:
                const cameraBack = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardBack');
                (<OrthographicCamera>cameraBack).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BACK;
                this.assignCamera(cameraBack.id);
                break;
            case 6:
                const cameraFront = this.createCamera(CAMERATYPE.ORTHOGRAPHIC, 'standardFront');
                (<OrthographicCamera>cameraFront).direction = ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT;
                this.assignCamera(cameraFront.id);
                break;
            default:
                let cameraPerspective;
                for(let c in this.getCameras()) 
                    if(this.getCameras()[c].id === 'standard' && this.getCameras()[c].type === CAMERATYPE.PERSPECTIVE)
                        cameraPerspective = this.getCameras()[c];

                if(!cameraPerspective) cameraPerspective = this.createCamera(CAMERATYPE.PERSPECTIVE, 'standard');
                this.assignCamera(cameraPerspective.id);
        }
        for (let c in this._cameras)
            this._cameras[c].applySettings();
        this._settingsApplied = true;
    }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public assignCamera(id: string): void {
        const camera = this.getCamera(id);
        if (!camera) return;
        this._camera = camera;
    }

    public createCamera(type: CAMERATYPE, id?: string): Camera {
        const cameraId = id || this._uuidGenerator.create();
        if (this._cameras[cameraId]) this._logger.error(LOGGINGTOPIC.CAMERA, new SDError(`Camera: Camera (${type}) with this id (${cameraId}) already exists.`));
        if (CAMERATYPE.ORTHOGRAPHIC === type) {
            const camera = new OrthographicCamera(cameraId, this._canvas.canvasElement);
            this._camerasDomEventListenerToken[cameraId] = this._domEventEngine.addDomEventListener((<OrthographicCameraControls>camera.controls).cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            camera.boundingBox = this._boundingBox.clone();
            if(this._settingsApplied) {
                camera.applySettings();
            } else {
                camera.zoomTo([], { duration: 0 });
            }
            return camera;
        } else {
            const camera = new PerspectiveCamera(cameraId, this._canvas.canvasElement);
            this._camerasDomEventListenerToken[cameraId] = this._domEventEngine.addDomEventListener((<PerspectiveCameraControls>camera.controls).cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            camera.boundingBox = this._boundingBox.clone();
            if(this._settingsApplied) {
                camera.applySettings();
            } else {
                camera.zoomTo([], { duration: 0 });
            }
            return camera;
        }
    }

    public getCamera(id?: string): Camera | null {
        if(!id) {
            if(this._camera) return this._camera;
            return null;
        }
        const camera = this._cameras[id];
        if (!camera) return null;
        return camera;
    }

    public getCameras(): { [key: string]: Camera } {
        const r: { [key: string]: Camera } = {};
        for (let c in this._cameras)
            r[c] = this._cameras[c];
        return r;
    }

    public hasCamera(): boolean {
        return this._camera ? true : false;
    }

    public removeCamera(id: string): boolean {
        const camera = this._cameras[id];
        if(!camera) return false;
        this._domEventEngine.removeDomEventListener(this._camerasDomEventListenerToken[id])
        if(this._camera && this._camera.id === id) 
            this._camera = null;
        delete this._cameras[id];
        delete this._camerasDomEventListenerToken[id];
        return true;
    }

    // #endregion Public Methods (5)
}