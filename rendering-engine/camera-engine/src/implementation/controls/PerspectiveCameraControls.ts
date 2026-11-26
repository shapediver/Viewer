import {type ICamera} from "../..";
import {AbstractCameraControls} from "./AbstractCameraControls";
import {CameraControlsEventDistribution} from "./CameraControlsEventDistribution";
import {CameraControlsLogic} from "./CameraControlsLogic";

export class PerspectiveCameraControls extends AbstractCameraControls {
	// #region Properties (3)

	private _settingsAdjustments = {
		// radians per millisecond: 1 = one full turn per minute
		autoRotationSpeed: (2 * Math.PI) / 60000,
		damping: 1.0,
		movementSmoothness: 1.0,
		// 0.5 = the point under the pointer at target depth follows the pointer
		panSpeed: 2.0,
		// 0.5 = one full turn per canvas height
		rotationSpeed: 4 * Math.PI,
		zoomSpeed: 0.025,
	};
	private _touchAdjustments = {
		autoRotationSpeed: 1.0,
		damping: 1.0,
		movementSmoothness: 1.0,
		panSpeed: 1.0,
		rotationSpeed: 1.0,
		zoomSpeed: 100.0,
	};

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(camera: ICamera, enabled: boolean) {
		super(camera, enabled);
		this._cameraLogic = new CameraControlsLogic(
			this,
			this._settingsAdjustments,
			this._touchAdjustments,
		);
		this._cameraControlsEventDistribution =
			new CameraControlsEventDistribution(this, this._cameraLogic);
	}

	// #endregion Constructors (1)
}
