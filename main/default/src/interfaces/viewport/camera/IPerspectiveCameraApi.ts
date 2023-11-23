import { ICameraApi } from './ICameraApi';
import { vec3 } from 'gl-matrix';

/**
 * The api for a perspective camera.
 * A perspective camera can be created by calling the {@link createPerspectiveCamera} method.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface IPerspectiveCameraApi extends ICameraApi {
    // #region Properties (23)

    /**
     * The speed of the camera for auto rotating.
     */
    autoRotationSpeed: number;
    /**
     * The restrictions for the position of the camera with a cube.
     */
    cubePositionRestriction: { min: vec3, max: vec3 };
    /**
     * The restrictions for the target of the camera with a cube.
     */
    cubeTargetRestriction: { min: vec3, max: vec3 };
    /**
     * The damping factor for the camera.
     */
    damping: number;
    /**
     * Option to enable auto rotating.
     */
    enableAutoRotation: boolean;
    /**
     * Option to enable the rotation of the camera on the azimuth axis (left/right). (default: true)
     */
    enableAzimuthRotation: boolean;
    /**
     * Option to enable panning with key presses.
     */
    enableKeyPan: boolean;
    /**
     * Option to enable panning.
     */
    enablePan: boolean;
    /**
     * Option to enable the rotation of the camera on the polar axis (up/down). (default: true)
     */
    enablePolarRotation: boolean;
    /**
     * Option to enable rotating.
     */
    enableRotation: boolean;
    /**
     * Option to enable the turntable controls. (default: false)
     */
    enableTurntableControls: boolean;
    /**
     * Option to enable zooming.
     */
    enableZoom: boolean;
    /**
     * The field of view for the camera.
     */
    fov: number;
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
     * The restrictions for the rotation of the camera.
     */
    rotationRestriction: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number };
    /**
     * The speed of the camera for rotating.
     */
    rotationSpeed: number;
    /**
     * The restrictions for the position of the camera with a sphere.
     */
    spherePositionRestriction: { center: vec3, radius: number };
    /**
     * The restrictions for the target of the camera with a sphere.
     */
    sphereTargetRestriction: { center: vec3, radius: number };
    /**
     * The center of the turntable when {@link enableTurntableControls} is activated. (default: [0,0,0])
     */
    turntableCenter: vec3;
    /**
     * The restrictions for the zooming of the camera.
     */
    zoomRestriction: { minDistance: number, maxDistance: number };
    /**
     * The speed of the camera for zooming.
     */
    zoomSpeed: number;

    // #endregion Properties (23)
}