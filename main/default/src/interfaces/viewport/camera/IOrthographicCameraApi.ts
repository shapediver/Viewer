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
     * 
     * ATOM: can this be updated?
     */
    direction: ORTHOGRAPHIC_CAMERA_DIRECTION;

    /**
     * The damping factor for the camera.
     * 
     * ATOM: Let's add details on how this works.
     */
    damping: number;

    /**
     * Option to enable panning with key presses.
     */
    enableKeyPan: boolean;

    /**
     * Option to enable panning.
     * 
     * ATOM: Let's add a description of the controls, i.e. which mouse buttons have to be pressed, and how it works with touch events.
     */
    enablePan: boolean;

    /**
     * Option to enable zooming.
     * 
     * ATOM: Let's add a description of the controls, i.e. which mouse buttons have to be pressed, and how it works with touch events.
     */
    enableZoom: boolean;

    /**
     * The speed of the camera for key panning.
     * 
     * ATOM: Let's add details on how this works.
     */
    keyPanSpeed: number;

    /**
     * The factor for applying smoothing to the camera movement.
     * 
     * ATOM: Let's add details on how this works.
     */
    movementSmoothness: number;

    /**
     * The speed of the camera for panning.
     * 
     * ATOM: Let's add details on how this works.
     */
    panSpeed: number;

    /**
     * The speed of the camera for zooming.
     * 
     * ATOM: Let's add details on how this works.
     */
    zoomSpeed: number;
}