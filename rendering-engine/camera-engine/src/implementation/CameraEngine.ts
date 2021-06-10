import { DomEventEngine, EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { UuidGenerator } from "@shapediver/viewer.shared.utils";
import { container, singleton } from "tsyringe";
import { CAMERATYPE, ICameraEngine } from "../interfaces/ICameraEngine";
import { AbstractCamera as Camera } from "./camera/AbstractCamera";
import { Canvas } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { Box } from "@shapediver/viewer.shared.math";
import { OrthographicCameraControls } from "./controls/OrthographicCameraControls";
import { PerspectiveCamera } from "./camera/PerspectiveCamera";
import { OrthographicCamera } from "./camera/OrthographicCamera";
import { PerspectiveCameraControls } from "./controls/PerspectiveCameraControls";

export class CameraEngine implements ICameraEngine {
    // #region Properties (3)

    private readonly _cameras: {
        [key: string]: Camera
    } = {};
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    protected _boundingBox: Box = new Box();

    private _camera!: Camera;
    private _settingsApplied: boolean = false;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _canvas: Canvas, private readonly _domEventEngine: DomEventEngine) {        
        this._eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (bb: any) => {
            this._boundingBox = bb.clone()
            
            for (let c in this._cameras)
                this._cameras[c].boundingBox = bb.clone();
        });
    }

    public applySettings() {
        // 0 -> perspective
        // 1 -> top
        // 2 -> bottom
        // 3 -> right
        // 4 -> left
        // 5 -> back
        // 6 -> front
        // https://shapediver.atlassian.net/browse/SS-2948
        this._settingsEngine.camera.cameraTypes.active.value;
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
        if (this._cameras[cameraId]) new Error('Camera with this id already exists.');
        if (CAMERATYPE.ORTHOGRAPHIC === type) {
            const camera = new OrthographicCamera(cameraId, this._canvas.canvasElement);
            this._domEventEngine.addDomEventListener((<OrthographicCameraControls>camera.controls).cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            camera.boundingBox = this._boundingBox.clone();
            if(this._settingsApplied) camera.applySettings();
            return camera;
        } else {
            const camera = new PerspectiveCamera(cameraId, this._canvas.canvasElement);
            this._domEventEngine.addDomEventListener((<PerspectiveCameraControls>camera.controls).cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            camera.boundingBox = this._boundingBox.clone();
            if(this._settingsApplied) camera.applySettings();
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

    // #endregion Public Methods (5)
}