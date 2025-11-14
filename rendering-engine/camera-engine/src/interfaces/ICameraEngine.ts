import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";
import {ICamera} from "./camera/ICamera";

// #region Interfaces (1)

export interface ICameraEngine {
	loadDefaultCameras: boolean;

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
