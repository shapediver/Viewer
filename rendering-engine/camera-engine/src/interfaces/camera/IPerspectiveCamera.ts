import {type ICameraControls} from "../controls/ICameraControls";
import {type ICamera} from "./ICamera";

export interface IPerspectiveCamera extends ICamera {
	// #region Properties (2)

	readonly controls: ICameraControls;

	fov: number;

	// #endregion Properties (2)

	// #region Public Methods (1)

	clone(): IPerspectiveCamera;

	// #endregion Public Methods (1)
}
