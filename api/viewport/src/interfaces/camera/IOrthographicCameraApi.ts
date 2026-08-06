import {ORTHOGRAPHIC_CAMERA_DIRECTION} from "@shapediver/viewer.rendering-engine.camera-engine";
import {type ICameraApi} from "./ICameraApi";

/**
 * The api for an orthographic camera.
 * An orthographic camera can be created by calling the `createOrthographicCamera` method.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface IOrthographicCameraApi extends ICameraApi {
	// #region Properties (1)

	/**
	 * The direction of the camera. (default: ORTHOGRAPHIC_CAMERA_DIRECTION.CUSTOM)
	 */
	direction: ORTHOGRAPHIC_CAMERA_DIRECTION;

	// #endregion Properties (1)
}
