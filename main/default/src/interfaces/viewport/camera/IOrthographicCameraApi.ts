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
     * MTOA: of course
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
     * Option to enable panning.
     * 
     * ATOM: Let's add a description of the controls, i.e. which mouse buttons have to be pressed, and how it works with touch events.
     * MTOA: I'd rather not, currently we don't expose it, but we might make it possible to change the inputs.
     */
    enablePan: boolean;

    /**
     * Option to enable zooming.
     * 
     * ATOM: Let's add a description of the controls, i.e. which mouse buttons have to be pressed, and how it works with touch events.
     * MTOA: I'd rather not, currently we don't expose it, but we might make it possible to change the inputs.
     */
    enableZoom: boolean;

    /**
     * The speed of the camera for key panning.
     * MTOA: how key panning works?
     */
    keyPanSpeed: number;

    /**
     * The factor for applying smoothing to the camera movement.
     * The various events that come in are blended together to ensure that extremes are not as pronounced.
     */
    movementSmoothness: number;

    /**
     * The speed of the camera for panning.
     * 
     * ATOM: Let's add details on how this works.
     * MTOA: how panning works?
     */
    panSpeed: number;

    /**
     * The speed of the camera for zooming.
     * 
     * ATOM: Let's add details on how this works.
     * MTOA: how zooming works?
     */
    zoomSpeed: number;
}