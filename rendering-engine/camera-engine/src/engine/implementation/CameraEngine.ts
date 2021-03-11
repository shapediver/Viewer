import { DomEventEngine } from "@shapediver/viewer.shared.services";
import { UuidGenerator } from "@shapediver/viewer.shared.utils";
import { container, singleton } from "tsyringe";
import { CAMERATYPE, ICameraEngine } from "../interface/ICameraEngine";
import { AbstractCamera as Camera } from "./AbstractCamera";
import { OrthographicCamera } from "./OrthographicCamera";
import { PerspectiveCamera } from "./PerspectiveCamera";
import { Canvas } from '@shapediver/viewer.rendering-engine.canvas-engine';

export class CameraEngine implements ICameraEngine {
    // #region Properties (3)

    private readonly _cameras: {
        [key: string]: Camera
    } = {};
    private readonly _uuidGenerator: UuidGenerator = container.resolve(UuidGenerator);

    private _camera!: Camera;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _canvas: Canvas, private readonly _domEventEngine: DomEventEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (4)

    public assignCamera(id: string): void {
        const camera = this.getCamera(id);
        if (!camera) new Error('Camera with this id does not exist.');
        this._camera = camera;
    }

    public createCamera(type: CAMERATYPE, id?: string): Camera {
        const cameraId = id || this._uuidGenerator.create();
        if (this._cameras[cameraId]) new Error('Camera with this id already exists.');
        if (CAMERATYPE.ORTHOGRAPHIC === type) {
            const camera = new OrthographicCamera(cameraId, this._canvas.canvasElement);
            this._domEventEngine.addDomEventListener(camera.controls.cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            return camera;
        } else {
            const camera = new PerspectiveCamera(cameraId, this._canvas.canvasElement);
            this._domEventEngine.addDomEventListener(camera.controls.cameraControlsEventDistribution);
            this._cameras[cameraId] = camera;
            return camera;
        }
    }

    public getCamera(id?: string): Camera {
        if(!id) {
            if(this._camera) return this._camera;
            throw new Error('No camera is active at the moment.');
        }
        const camera = this._cameras[id];
        if (!camera) throw new Error('Camera with this id does not exist.');
        return camera;
    }

    public getCameras(): { [key: string]: Camera } {
        const r: { [key: string]: Camera } = {};
        for (let c in this._cameras)
            r[c] = this._cameras[c];
        return r;
    }

    // #endregion Public Methods (4)
}