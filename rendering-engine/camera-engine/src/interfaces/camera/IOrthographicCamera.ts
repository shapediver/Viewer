import {ORTHOGRAPHIC_CAMERA_DIRECTION} from "@shapediver/viewer.shared.types";
import {ICameraControls} from "../controls/ICameraControls";
import {ICamera} from "./ICamera";

// #region Interfaces (1)

export interface IOrthographicCamera extends ICamera {
	// #region Properties (2)

	readonly controls: ICameraControls;

	direction: ORTHOGRAPHIC_CAMERA_DIRECTION;

	// #endregion Properties (2)

	// #region Public Methods (1)

	clone(): IOrthographicCamera;

	// #endregion Public Methods (1)
}

// #endregion Interfaces (1)
