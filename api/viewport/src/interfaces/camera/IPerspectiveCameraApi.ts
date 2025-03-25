import {ICameraApi} from "./ICameraApi";

/**
 * The api for a perspective camera.
 * A perspective camera can be created by calling the {@link createPerspectiveCamera} method.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface IPerspectiveCameraApi extends ICameraApi {
	// #region Properties (1)

	/**
	 * The field of view for the camera.
	 */
	fov: number;

	// #endregion Properties (1)
}
