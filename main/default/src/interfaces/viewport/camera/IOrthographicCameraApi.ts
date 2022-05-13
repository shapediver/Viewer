import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer.rendering-engine.camera-engine';
import { ICameraApi } from './ICameraApi'

/**
 * The api for an orthographic camera.
 * An orthographic camera can be created by calling the {@link createOrthographicCamera} method.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface IOrthographicCameraApi extends ICameraApi {
    /**
     * The direction of the camera.
     */
    direction: ORTHOGRAPHIC_CAMERA_DIRECTION;
    

    /**
     * The damping factor for the camera.
     */
    damping: number;

    /**
     * Option to enable panning with key presses.
     */
    enableKeyPan: boolean;

    /**
     * Option to enable panning.
     */
    enablePan: boolean;

    /**
     * Option to enable zooming.
     */
    enableZoom: boolean;

    /**
     * The speed of the camera for key panning.
     */
    keyPanSpeed: number;

    /**
     * The factor for applying smoothing to the camera movement.
     */
    movementSmoothness: number;

    /**
     * The speed of the camera for panning.
     */
    panSpeed: number;

    /**
     * The speed of the camera for zooming.
     */
    zoomSpeed: number;
}