import {type IViewportEvent} from "./IViewportEvent";

/**
 * Definition of the camera event.
 * These events are sent when the camera starts, moves or ends ({@link EVENTTYPE_CAMERA}).
 */
export interface ICameraEvent extends IViewportEvent {
	// #region Properties (1)

	/**
	 * The id of the camera.
	 */
	cameraId: string;

	// #endregion Properties (1)
}
