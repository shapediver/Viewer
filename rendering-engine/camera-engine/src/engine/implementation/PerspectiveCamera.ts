import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { vec3 } from "gl-matrix";
import { PerspectiveCameraControls } from "../../controls/implementation/PerspectiveCameraControls";

export class PerspectiveCamera extends AbstractCamera {
  // #region Properties (3)

  private readonly _converter: Converter = <Converter>container.resolve(Converter);
  private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

  private _fov: number = 60;

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(id: string, _canvas: HTMLCanvasElement) {
    super(id, CAMERATYPE.PERSPECTIVE);
    this._controls = new PerspectiveCameraControls(_canvas, true);
    const initSettings = () => {
      let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.position);
      let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.target);
      if (vec3.equals(position, target)) {
        position = vec3.fromValues(0, 1, 0);
        target = vec3.create();
      }
      this.position = position;
      this.target = target;
      this.fov = this._settingsEngine.camera.cameraTypes.perspective.fov.value;
    };
    if(this._stateEngine.settingsRegistered.resolved === true) {
      initSettings();
    } else {
        this._stateEngine.settingsRegistered.then(() => initSettings());
    }
  }

  /**
   * Getter fov
   * @return {number}
   */
  public get fov(): number {
    return this._fov;
  }

  /**
   * Setter fov
   * @param {number} value
   */
  public set fov(value: number) {
    this._fov = value;
  }

  // #endregion Constructors (1)
}