import { container } from 'tsyringe';

import { CameraSettings, OrbitControlsSettings } from '@shapediver/viewer.shared.settings-engine';

import { CameraControlsLogic } from './CameraControlsLogic';

export class CameraControlsEventDistribution {
  // #region Properties (2)

  private _active = {
    rotation: false,
    zoom: false,
    pan: false
  };
  private _settings: OrbitControlsSettings​​ = <OrbitControlsSettings​​>container.resolve(OrbitControlsSettings​​);

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(private readonly _cameraLogic: CameraControlsLogic) { }

  // #endregion Constructors (1)

  // #region Public Methods (14)

  public onDown(event: MouseEvent|TouchEvent): void {
    let {x,y} = this.convertInput(event);

    let input = window.TouchEvent && event instanceof TouchEvent ? (event as TouchEvent).touches.length : (event as MouseEvent).button;
    let mapping = window.TouchEvent && event instanceof TouchEvent ? this._settings.input.value.touch : this._settings.input.value.mouse;

    if (input === mapping.rotate && this._settings.enableRotation.value) {
      this._cameraLogic.rotate(x, y, this._active.rotation, window.TouchEvent && event instanceof TouchEvent);
      this._active.rotation = true;
      this._active.pan = false;
      this._active.zoom = false;
    }

    if (input === mapping.pan && this._settings.enablePan.value) {
      this._cameraLogic.pan(x, y, this._active.pan, window.TouchEvent && event instanceof TouchEvent);
      this._active.rotation = false;
      this._active.pan = true;
      this._active.zoom = false;    
    }

    if (input === mapping.zoom && this._settings.enableZoom.value) {
      let x1 = x, y1 = y;
      if(window.TouchEvent && event instanceof TouchEvent && this._settings.input.value.touch.zoom === 2) {
        x1 = (event.touches[0].pageX - event.touches[1].pageX)/ window.innerWidth * (window.innerWidth / window.innerHeight);
        y1 = (event.touches[0].pageY - event.touches[1].pageY)/ window.innerHeight;
      }
      this._cameraLogic.zoom(x1, y1, this._active.zoom, window.TouchEvent && event instanceof TouchEvent);
      this._active.rotation = false;
      this._active.pan = false;
      this._active.zoom = true;
    }
  }

  public onKey(event: KeyboardEvent): void {
    if(!this._settings.enableKeyPan.value) return;
    switch (event.keyCode) {
      case this._settings.input.value.keys.up:
        this._cameraLogic.pan(0, 0, false, false);
        this._cameraLogic.pan(0, this._settings.keyPanSpeed.value * 0.05, true, false);
        event.preventDefault();
        event.stopPropagation();
        break;

      case this._settings.input.value.keys.down:
        this._cameraLogic.pan(0, 0, false, false);
        this._cameraLogic.pan(0, -this._settings.keyPanSpeed.value * 0.05, true, false);
        event.preventDefault();
        event.stopPropagation();
        break;

      case this._settings.input.value.keys.left:
        this._cameraLogic.pan(0, 0, false, false);
        this._cameraLogic.pan(this._settings.keyPanSpeed.value * 0.05, 0, true, false);
        event.preventDefault();
        event.stopPropagation();
        break;

      case this._settings.input.value.keys.right:
        this._cameraLogic.pan(0, 0, false, false);
        this._cameraLogic.pan(-this._settings.keyPanSpeed.value * 0.05, 0, true, false);
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    this.onKey(event)
  }

  public onMouseDown(event: MouseEvent): void {
    this.onDown(event);
  }

  public onMouseMove(event: MouseEvent): void {
    this.onMove(event);
  }

  public onMouseUp(event: MouseEvent): void {
    this.onUp(event);
  }

  public onMouseWheel(event: WheelEvent): void {
    this.onWheel(event);
  }

  public onMove(event: MouseEvent|TouchEvent): void {
    let {x,y} = this.convertInput(event);

    if (this._settings.enableRotation.value && this._active.rotation)
      this._cameraLogic.rotate(x, y, this._active.rotation, window.TouchEvent && event instanceof TouchEvent);

    if (this._settings.enablePan.value && this._active.pan)
      this._cameraLogic.pan(x, y, this._active.pan, window.TouchEvent && event instanceof TouchEvent);

    if (this._settings.enableZoom.value && this._active.zoom){
      let x1 = x, y1 = y;
      if(window.TouchEvent && event instanceof TouchEvent && this._settings.input.value.touch.zoom === 2) {
        x1 = (event.touches[0].pageX - event.touches[1].pageX)/ window.innerWidth * (window.innerWidth / window.innerHeight);
        y1 = (event.touches[0].pageY - event.touches[1].pageY)/ window.innerHeight;
      }
      this._cameraLogic.zoom(x1, y1, this._active.zoom, window.TouchEvent && event instanceof TouchEvent);
    }
  }

  public onTouchEnd(event: TouchEvent): void {
    this.onUp(event);
  }

  public onTouchMove(event: TouchEvent): void {
    this.onMove(event);
  }

  public onTouchStart(event: TouchEvent): void {
    this.onDown(event);
  }

  public onUp(event: MouseEvent|TouchEvent): void {
    this._active.rotation = false;
    this._active.zoom = false;
    this._active.pan = false;
  }

  public onWheel(event: WheelEvent): void {
    if(!this._settings.enableZoom.value) return;
    let delta = 0;
    if (event.deltaY  !== undefined) {
      // WebKit / Opera / Explorer 9
      delta = -event.deltaY ;
    } else if (event.detail !== undefined) {
      // Firefox
      delta = -event.detail;
    }
    // convert to 2 screen coordinates that are far enough
    if(Math.sign(delta) > 0) {
      this._cameraLogic.zoom(0, 0, false, false);
      this._cameraLogic.zoom(1, 0, true, false);
    } else {
      this._cameraLogic.zoom(1, 0, false, false);
      this._cameraLogic.zoom(0, 0, true, false);
    }
  }

  public reset() {
    this._active = {
      rotation: false,
      zoom: false,
      pan: false
    };
  }

  // #endregion Public Methods (14)

  // #region Private Methods (1)

  private convertInput(event: MouseEvent|TouchEvent): {x: Number, y: Number} {
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
