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

// #region Enums (1)

export enum ORTHOGRAPHIC_CAMERA_DIRECTION {
	TOP = "top",
	BOTTOM = "bottom",
	LEFT = "left",
	RIGHT = "right",
	FRONT = "front",
	BACK = "back",
	CUSTOM = "custom",
}

// #endregion Enums (1)
