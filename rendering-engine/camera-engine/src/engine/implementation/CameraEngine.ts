import { DomEventEngine, SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { UuidGenerator } from "@shapediver/viewer.shared.utils";
import { container, singleton } from "tsyringe";
import { CAMERATYPE, ICameraEngine } from "../interface/ICameraEngine";
import { AbstractCamera as Camera } from "./AbstractCamera";
import { OrthographicCamera } from "./OrthographicCamera";
import { PerspectiveCamera } from "./PerspectiveCamera";
import { Canvas } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { OrthographicCameraControls } from "../../controls/implementation/OrthographicCameraControls";

export class CameraEngine implements ICameraEngine {
    // #region Properties (3)

    private readonly _cameras: {
        [key: string]: Camera
    } = {};
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  
    private _camera!: Camera;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _canvas: Canvas, private readonly _domEventEngine: DomEventEngine) { }

    public applySettings() {
        // 0 -> perspective
        // 1 -> top
        // 2 -> bottom
        // 3 -> right
        // 4 -> left
        // 5 -> back
        // 6 -> front
        // FIXME
        this._settingsEngine.camera.cameraTypes.active.value;
        for (let c in this._cameras)
            this._cameras[c].applySettings();
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
            return camera;
        } else {
            const camera = new PerspectiveCamera(cameraId, this._canvas.canvasElement);
            this._domEventEngine.addDomEventListener((<OrthographicCameraControls>camera.controls).cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
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