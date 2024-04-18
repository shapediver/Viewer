import { ICameraControls } from '../../interfaces/controls/ICameraControls';
import { ICameraControlsEventDistribution } from '../../interfaces/controls/ICameraControlsEventDistribution';
import { ICameraControlsLogic } from '../../interfaces/controls/ICameraControlsLogic';

export class CameraControlsEventDistribution implements ICameraControlsEventDistribution {
  // #region Properties (6)

  protected _active = {
    rotation: false,
    zoom: false,
    pan: false
  };
  protected _activeEvents = true;
  protected _cameraLogic: ICameraControlsLogic;
  protected _controls: ICameraControls;
  protected _primaryPointerEvent?: PointerEvent;
  protected _secondaryPointerEvent?: PointerEvent;

  // #endregion Properties (6)

  // #region Constructors (1)

  constructor(controls: ICameraControls, cameraLogic: ICameraControlsLogic) {
    this._controls = controls;
    this._cameraLogic = cameraLogic;
  }

  // #endregion Constructors (1)

  // #region Public Methods (16)

  public activateCameraEvents(): void {
    this._activeEvents = true;
  }

  public deactivateCameraEvents(): void {
    this._activeEvents = false;
    this.reset();
  }

  public onDown(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;

    const { x, y } = this.convertInput(event);

    const touchEvent = event.pointerType === 'touch';
    const input = this.getInput(event);
    const mapping = event.pointerType === 'touch' ? this._controls.input.touch : this._controls.input.mouse;

    if (input === mapping.rotate && this._controls.enableRotation) {
      this._cameraLogic.rotate(x, y, this._active.rotation, touchEvent);
      this._active.rotation = true;
    } else {
      this._active.rotation = false;
    }

    if (input === mapping.pan && this._controls.enablePan) {
      this._cameraLogic.pan(x, y, this._active.pan, touchEvent);
      this._active.pan = true;
    } else {
      this._active.pan = false;
    }

    if (input === mapping.zoom && this._controls.enableZoom) {
      let x1 = x, y1 = y;
      if (touchEvent && this._controls.input.touch.zoom === 2 && this._primaryPointerEvent && this._secondaryPointerEvent) {
        x1 = (this._primaryPointerEvent!.pageX - this._secondaryPointerEvent!.pageX) / window.innerWidth * (window.innerWidth / window.innerHeight);
        y1 = (this._primaryPointerEvent!.pageY - this._secondaryPointerEvent!.pageY) / window.innerHeight;
      }
      this._cameraLogic.zoom(x1, y1, this._active.zoom, touchEvent);
      this._active.zoom = true;
    } else {
      this._active.zoom = false;
    }
  }

  public onKey(event: KeyboardEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._controls.enableKeyPan) return;
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

  public onKeyDown(event: KeyboardEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;
    this.onKey(event);
  }

  public onKeyUp(event: KeyboardEvent): void { }

  public onMouseWheel(event: WheelEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;
    this.onWheel(event);
  }

  public onMove(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;
    const { x, y } = this.convertInput(event);

    const touchEvent = event.pointerType === 'touch';

    if (this._controls.enableRotation && this._active.rotation)
      this._cameraLogic.rotate(x, y, this._active.rotation, touchEvent);

    if (this._controls.enablePan && this._active.pan)
      this._cameraLogic.pan(x, y, this._active.pan, touchEvent);

    if (this._controls.enableZoom && this._active.zoom) {
      let x1 = x, y1 = y;
      if (touchEvent && this._controls.input.touch.zoom === 2 && this._primaryPointerEvent && this._secondaryPointerEvent) {
        x1 = (this._primaryPointerEvent!.pageX - this._secondaryPointerEvent!.pageX) / window.innerWidth * (window.innerWidth / window.innerHeight);
        y1 = (this._primaryPointerEvent!.pageY - this._secondaryPointerEvent!.pageY) / window.innerHeight;
      }
      this._cameraLogic.zoom(x1, y1, this._active.zoom, touchEvent);
    }
  }

  public onPointerDown(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;

    if (event.isPrimary === true)
      this._primaryPointerEvent = event;
    else if (event.isPrimary === false)
      this._secondaryPointerEvent = event;

    this.onDown(event);
  }

  public onPointerEnd(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;

    if (event.isPrimary === true)
      this._primaryPointerEvent = undefined;
    else if (event.isPrimary === false)
      this._secondaryPointerEvent = undefined;

    this.onUp(event);
  }

  public onPointerMove(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;

    if (event.isPrimary === true)
      this._primaryPointerEvent = event;
    else if (event.isPrimary === false)
      this._secondaryPointerEvent = event;

    this.onMove(event);
  }

  public onPointerOut(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;

    if (event.isPrimary === true)
      this._primaryPointerEvent = undefined;
    else if (event.isPrimary === false)
      this._secondaryPointerEvent = undefined;
  }

  public onPointerUp(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;

    if (event.isPrimary === true)
      this._primaryPointerEvent = undefined;
    else if (event.isPrimary === false)
      this._secondaryPointerEvent = undefined;
  }

  public onUp(event: PointerEvent): void {
    if (this._controls.camera.active === false) return;
    this._active.rotation = false;
    this._active.zoom = false;
    this._active.pan = false;
  }

  public onWheel(event: WheelEvent): void {
    if (this._controls.camera.active === false) return;
    if (!this._activeEvents) return;
    if (!this._controls.enableZoom) return;
    let delta = 0;
    if (event.deltaY !== undefined) {
      // WebKit / Opera / Explorer 9
      delta = -event.deltaY;
    } else if (event.detail !== undefined) {
      // Firefox
      delta = -event.detail;
    }
    // convert to 2 screen coordinates that are far enough
    if (Math.sign(delta) > 0) {
      this._cameraLogic.zoom(0, 0, false, false);
      this._cameraLogic.zoom(1, 0, true, false);
    } else {
      this._cameraLogic.zoom(1, 0, false, false);
      this._cameraLogic.zoom(0, 0, true, false);
    }
  }

  public reset(): void {
    this._active = {
      rotation: false,
      zoom: false,
      pan: false
    };
  }

  // #endregion Public Methods (16)

  // #region Protected Methods (2)

  protected convertInput(event: PointerEvent): { x: number, y: number } {
    if (this._primaryPointerEvent && this._secondaryPointerEvent) {
      return {
        x: (this._primaryPointerEvent.pageX + this._secondaryPointerEvent.pageX) / 2,
        y: (this._primaryPointerEvent.pageY + this._secondaryPointerEvent.pageY) / 2
      };
    } else {
      return {
        x: event.clientX,
        y: event.clientY
      };
    }
  }

  protected getInput(event: PointerEvent): number {
    if (event.pointerType === 'touch') {
      if (this._secondaryPointerEvent) {
        return 2;
      } else {
        return 1;
      }
    } else {
      return event.button;
    }
  }

  // #endregion Protected Methods (2)
}