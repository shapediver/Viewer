import {
	CAMERA_TYPE,
	ICameraOptions,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {IBox} from "@shapediver/viewer.shared.math";
import {vec2, vec3} from "gl-matrix";

/**
 * The api for a camera, please see the definitions for the [perspective camera api]{@link IPerspectiveCameraApi} and the [orthographic camera api]{@link IOrthographicCameraApi} as this is just a shared interface for both.
 * A camera can be created by calling the corresponding method in the {@link IViewportApi}.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface ICameraApi {
	// #region Properties (38)

	/**
	 * The id of the camera.
	 */
	readonly id: string;
	/**
	 * The type of camera that is being used.
	 */
	readonly type: CAMERA_TYPE;
	/**
	 * If the camera is the default camera of the viewport.
	 */
	readonly isDefault: boolean;

	/**
	 * Option to automatically adjust the camera to the size of the scene whenever a call to
	 * {@link ISessionApi.customize} replaced {@link ISessionApi.node}.
	 * This does not happen in case {@link ISessionApi.automaticSceneUpdate} is set to false.
	 */
	autoAdjust: boolean;
	/**
	 * The speed of the camera for auto rotating.
	 */
	autoRotationSpeed: number;
	/**
	 * The standard duration for camera movements.
	 */
	cameraMovementDuration: number;
	/**
	 * The restrictions for the position of the camera with a cube.
	 */
	cubePositionRestriction: {min: vec3; max: vec3};
	/**
	 * The restrictions for the target of the camera with a cube.
	 */
	cubeTargetRestriction: {min: vec3; max: vec3};
	/**
	 * The damping factor for the camera.
	 * The dampening affects how much the camera moves even after you let it got.
	 * This smooths the usage of the camera.
	 */
	damping: number;
	/**
	 * The default position of the camera.
	 */
	defaultPosition: vec3;
	/**
	 * The default target of the camera.
	 */
	defaultTarget: vec3;
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
	 * Option to enable the object controls. (default: false)
	 */
	enableObjectControls: boolean;
	/**
	 * Option to enable panning. Panning can be done by pressing the right mouse button or three-finger touch events.
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
	 * Option to enable zooming. Zooming can be done with the mouse wheel or two-finger touch events.
	 */
	enableZoom: boolean;
	/**
	 * Option to enable / disable the movement of the camera.
	 */
	enabled: boolean;
	/**
	 * If the camera should automatically adjust to the size of the scene whenever the scene is loaded for the first time.
	 */
	initialAutoAdjust: boolean;
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
	 * The name of the camera.
	 * Used by the platform.
	 */
	name?: string;
	/**
	 * The center of the object when {@link enableObjectControls} is activated. (default: [0,0,0])
	 */
	objectControlsCenter: vec3;
	/**
	 * Optional order property for the camera.
	 * Used by the platform.
	 */
	order?: number;
	/**
	 * The speed of the camera for panning. The higher this value, the faster you can pan.
	 */
	panSpeed: number;
	/**
	 * The current position of the camera.
	 */
	position: vec3;
	/**
	 * Option to animate the camera position and target to their defaults whenever the mouse/touch up event is fired.
	 */
	revertAtMouseUp: boolean;
	/**
	 * The standard duration for revertAtMouseUp animations.
	 */
	revertAtMouseUpDuration: number;
	/**
	 * The restrictions for the rotation of the camera.
	 */
	rotationRestriction: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	};
	/**
	 * The speed of the camera for rotating.
	 */
	rotationSpeed: number;
	/**
	 * The restrictions for the position of the camera with a sphere.
	 */
	spherePositionRestriction: {center: vec3; radius: number};
	/**
	 * The restrictions for the target of the camera with a sphere.
	 */
	sphereTargetRestriction: {center: vec3; radius: number};
	/**
	 * The current target of the camera.
	 */
	target: vec3;
	/**
	 * The center of the turntable when {@link enableTurntableControls} is activated. (default: [0,0,0])
	 */
	turntableCenter: vec3;
	/**
	 * The restrictions for the zooming of the camera.
	 */
	zoomRestriction: {minDistance: number; maxDistance: number};
	/**
	 * The speed of the camera for zooming. The higher this value, the faster you can zoom.
	 */
	zoomSpeed: number;
	/**
	 * The factor that is used when the {@link zoomTo} function is called.
	 *
	 * See also {@link calculateZoomTo}
	 */
	zoomToFactor: number;

	// #endregion Properties (38)

	// #region Public Methods (7)

	/**
	 * Let the camera follow a path along pairs of position and target.
	 *
	 * @param path The defined path.
	 * @param options Various options to be adjusted.
	 */
	animate(
		path: {position: vec3; target: vec3}[],
		options?: ICameraOptions,
	): Promise<boolean>;
	/**
	 * Calculate the position and target which a call to {@link zoomTo} would result in.
	 *
	 * If no target to zoom to is provided, the current bounding box is used.
	 * If no startingPosition and startingTarget are provided, the current camera position and target are used.
	 *
	 * @see {@link zoomToFactor}
	 *
	 * @param zoomTarget The target to zoom to.
	 * @param startingPosition The starting position of the camera.
	 * @param startingTarget The starting target of the camera.
	 */
	calculateZoomTo(
		zoomTarget?: IBox,
		startingPosition?: vec3,
		startingTarget?: vec3,
	): {position: vec3; target: vec3};
	/**
	 * Projects the vector from world space into the camera's normalized device coordinate (NDC) space.
	 *
	 * @param p The point in the scene to project.
	 */
	project(p: vec3): vec2;
	/**
	 * Reset / animate the camera to its default position and target.
	 *
	 * @param options Various options to be adjusted.
	 */
	reset(options?: ICameraOptions): Promise<boolean>;
	/**
	 * Set / animate the camera to a specific position and target.
	 *
	 * @param options Various options to be adjusted.
	 */
	set(
		position: vec3,
		target: vec3,
		options?: ICameraOptions,
	): Promise<boolean>;
	/**
	 * Projects the vector from the camera's normalized device coordinate (NDC) space into world space.
	 *
	 * @param p The point on the screen to project.
	 */
	unproject(p: vec3): vec3;
	/**
	 * Zoom to a specific part of the scene, or the whole scene (default).
	 *
	 * @param zoomTarget The target to zoom to.
	 * @param options Various options to be adjusted.
	 */
	zoomTo(zoomTarget?: IBox, options?: ICameraOptions): Promise<boolean>;

	// #endregion Public Methods (7)
}
