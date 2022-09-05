import { CameraControlsLogic } from './CameraControlsLogic'
import { ICameraControlsEventDistribution } from '../../../interfaces/controls/ICameraControlsEventDistribution'
import { OrthographicCameraControls } from '../OrthographicCameraControls'

export class CameraControlsEventDistribution implements ICameraControlsEventDistribution {
    // #region Properties (2)

    private _active = {
        zoom: false,
        pan: false
    };

    private _activeEvents = true;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _controls: OrthographicCameraControls, private readonly _cameraLogic: CameraControlsLogic) { }

    // #endregion Constructors (1)

    // #region Public Methods (14)
        
    public activateCameraEvents(): void {
        this._activeEvents = true;
    }

    public deactivateCameraEvents(): void {
        this._activeEvents = false;
    }

    public onDown(event: MouseEvent | TouchEvent): void {
        if(this._controls.camera.active === false) return;
        let { x, y } = this.convertInput(event);

        let input = window.TouchEvent && event instanceof TouchEvent ? (event as TouchEvent).touches.length : (event as MouseEvent).button;
        let mapping = window.TouchEvent && event instanceof TouchEvent ? this._controls.input.touch : this._controls.input.mouse;

        if (input === mapping.pan && this._controls.enablePan) {
            this._cameraLogic.pan(x, y, this._active.pan, window.TouchEvent && event instanceof TouchEvent);
            this._active.pan = true;
            this._active.zoom = false;
        }

        if (input === mapping.zoom && this._controls.enableZoom) {
            let x1 = x, y1 = y;
            if (window.TouchEvent && event instanceof TouchEvent && this._controls.input.touch.zoom === 2) {
                x1 = (event.touches[0].pageX - event.touches[1].pageX) / window.innerWidth * (window.innerWidth / window.innerHeight);
                y1 = (event.touches[0].pageY - event.touches[1].pageY) / window.innerHeight;
            }
            this._cameraLogic.zoom(x1, y1, this._active.zoom, window.TouchEvent && event instanceof TouchEvent);
            this._active.pan = false;
            this._active.zoom = true;
        }
    }

    public onKey(event: KeyboardEvent): void {
        if(this._controls.camera.active === false) return;
        if (this._controls.enableKeyPan) {
            switch (event.keyCode) {
                case this._controls.input.keys.up:
                    this._cameraLogic.pan(0, 0, false, false);
                    this._cameraLogic.pan(0, this._controls.keyPanSpeed * 0.05, true, false);
                    event.preventDefault();
                    event.stopPropagation();
                    break;

                case this._controls.input.keys.down:
                    this._cameraLogic.pan(0, 0, false, false);
                    this._cameraLogic.pan(0, -this._controls.keyPanSpeed * 0.05, true, false);
                    event.preventDefault();
                    event.stopPropagation();
                    break;

                case this._controls.input.keys.left:
                    this._cameraLogic.pan(0, 0, false, false);
                    this._cameraLogic.pan(this._controls.keyPanSpeed * 0.05, 0, true, false);
                    event.preventDefault();
                    event.stopPropagation();
                    break;

                case this._controls.input.keys.right:
                    this._cameraLogic.pan(0, 0, false, false);
                    this._cameraLogic.pan(-this._controls.keyPanSpeed * 0.05, 0, true, false);
                    event.preventDefault();
                    event.stopPropagation();
                    break;
            }
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onKey(event)
    }

    public onMouseDown(event: MouseEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onDown(event);
    }

    public onMouseMove(event: MouseEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onMove(event);
    }

    public onMouseEnd(event: MouseEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onUp(event);
    }
    
    public onMouseUp(event: WheelEvent): void {
        if(this._controls.camera.active === false) return;
    }

    public onMouseOut(event: WheelEvent): void {
        if(this._controls.camera.active === false) return;
    }

    public onMouseWheel(event: WheelEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onWheel(event);
    }

    public onMove(event: MouseEvent | TouchEvent): void {
        if(this._controls.camera.active === false) return;
        let { x, y } = this.convertInput(event);

        if (this._controls.enablePan && this._active.pan)
            this._cameraLogic.pan(x, y, this._active.pan, window.TouchEvent && event instanceof TouchEvent);

        if (this._controls.enableZoom && this._active.zoom) {
            let x1 = x, y1 = y;
            if (window.TouchEvent && event instanceof TouchEvent && this._controls.input.touch.zoom === 2) {
                x1 = (event.touches[0].pageX - event.touches[1].pageX) / window.innerWidth * (window.innerWidth / window.innerHeight);
                y1 = (event.touches[0].pageY - event.touches[1].pageY) / window.innerHeight;
            }
            this._cameraLogic.zoom(x1, y1, this._active.zoom, window.TouchEvent && event instanceof TouchEvent);
        }
    }

    public onTouchEnd(event: TouchEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onUp(event);
    }

    public onTouchMove(event: TouchEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onMove(event);
    }

    public onTouchStart(event: TouchEvent): void {
        if(this._controls.camera.active === false) return;
        if(!this._activeEvents) return;
        this.onDown(event);
    }

    public onTouchCancel(event: TouchEvent): void {
        if(this._controls.camera.active === false) return;
    }

    public onTouchUp(event: TouchEvent): void {
        if(this._controls.camera.active === false) return;
    }

    public onUp(event: MouseEvent | TouchEvent): void {
        if(this._controls.camera.active === false) return;
        this._active.zoom = false;
        this._active.pan = false;
    }

    public onWheel(event: WheelEvent): void {
        if(this._controls.camera.active === false) return;
        if (!this._controls.enableZoom) return;
        let delta = 0;
        if (event.deltaY !== undefined) {
            // WebKit / Opera / Explorer 9
            delta = -event.deltaY;
        } else if (event.detail !== undefined) {
            // Firefox
            delta = -event.detail;
        }

        if (Math.sign(delta) > 0) {
            this._cameraLogic.zoom(0, 0, false, false);
            this._cameraLogic.zoom(1.0, 0, true, false);
        } else {
            this._cameraLogic.zoom(1.0, 0, false, false);
            this._cameraLogic.zoom(0, 0, true, false);
        }
    }

    public reset() {
        this._active = {
            zoom: false,
            pan: false
        };
    }

    // #endregion Public Methods (14)

    // #region Private Methods (1)

    private convertInput(event: MouseEvent | TouchEvent): { x: number, y: number } {
        let aspect = window.innerWidth / window.innerHeight;
        if (event instanceof MouseEvent) {
            return {
                x: event.clientX / window.innerWidth * aspect,
                y: event.clientY / window.innerHeight
            }
        } else {
            return {
                x: event.touches[0].pageX / window.innerWidth * aspect,
                y: event.touches[0].pageY / window.innerHeight
            }
        }
    }

    // #endregion Private Methods (1)
}
