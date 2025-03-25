import {ICamera} from "./camera/ICamera";

// #region Interfaces (1)

export interface ICameraEngine {
	// #region Properties (1)

	update?: () => void;

	// #endregion Properties (1)

	// #region Public Methods (6)

	activateCameraEvents(): void;
	assignCamera(id: string): boolean;
	createCamera(type: CAMERA_TYPE, id?: string): ICamera;
	createDefaultCameras(): void;
	deactivateCameraEvents(): void;
	removeCamera(id: string): boolean;

	// #endregion Public Methods (6)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum CAMERA_TYPE {
	PERSPECTIVE = "perspective",
	ORTHOGRAPHIC = "orthographic",
}

// #endregion Enums (1)
