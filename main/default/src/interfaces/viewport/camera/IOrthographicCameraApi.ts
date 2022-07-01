import { ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer.rendering-engine.camera-engine';
import { ICameraApi } from './ICameraApi'

/**
 * The api for an orthographic camera.
 * An orthographic camera can be created by calling the {@link createOrthographicCamera} method.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface IOrthographicCameraApi extends ICameraApi {
    /**
     * The direction of the camera. (default: ORTHOGRAPHIC_CAMERA_DIRECTION.TOP)
     */
    direction: ORTHOGRAPHIC_CAMERA_DIRECTION;

    /**
     * The damping factor for the camera.
     * The dampening affects how much the camera moves even after you let it got.
     * This smooths the usage of the camera.
     */
    damping: number;

    /**
     * Option to enable panning with key presses.
     */
    enableKeyPan: boolean;

    /**
     * Option to enable panning. Panning can be done by pressing the right mouse button or three-finger touch events.
     */
    enablePan: boolean;

    /**
     * Option to enable zooming. Zooming can be done with the mouse wheel or two-finger touch events.
     */
    enableZoom: boolean;

    /**
     * The speed of the camera for key panning. The higher this value, the faster you can pan.
     */
    keyPanSpeed: number;

    /**
     * The factor for applying smoothing to the camera movement.
     * The various events that come in are blended together to ensure that extremes are not as pronounced.
     */
    movementSmoothness: number;

    /**
     * The speed of the camera for panning. The higher this value, the faster you can pan.
     */
    panSpeed: number;

    /**
     * The speed of the camera for zooming. The higher this value, the faster you can zoom.
     */
    zoomSpeed: number;
}