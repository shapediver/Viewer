import {
	CAMERA_TYPE,
	type ICameraOptions,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {type IBox} from "@shapediver/viewer.shared.math";
import {vec2, vec3} from "gl-matrix";

/**
 * The api for a camera, please see the definitions for the [perspective camera api]{@link IPerspectiveCameraApi} and the [orthographic camera api]{@link IOrthographicCameraApi} as this is just a shared interface for both.
 * A camera can be created by calling the corresponding method in the {@link IViewportApi}.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 * Setting any property requests a frame; it does not update the scene tree and does not fire `VIEWPORT_UPDATED`.
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
	 * `ISessionApi.customize` replaced `ISessionApi.node`.
	 * This does not happen in case `ISessionApi.automaticSceneUpdate` is set to false.
	 */
	autoAdjust: boolean;
	/**
	 * The speed of the camera for auto rotating.
	 * 1 = one full turn per minute, on any display refresh rate. Negative values turn the other way.
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
	 * The inertia of the camera after the pointer is released, the mouse wheel stops or a key was pressed.
	 * The remaining motion shrinks by this fraction every 1/60 s, on any display refresh rate.
	 * 1 = no inertia. The value is limited to the range from 0.01 to 1. (default: 0.1, about 160 ms)
	 *
	 * After a release the camera continues with the speed of the pointer and slows down;
	 * releasing a pointer that stands still gives no inertia.
	 * The setting does not change how far a drag, a wheel notch or a key press moves the camera.
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
	 * One key press pans a perspective camera by `keyPanSpeed` / 2 pixels at {@link panSpeed} 0.5,
	 * on any display refresh rate. A held key repeats with the key repeat rate of the system.
	 */
	keyPanSpeed: number;
	/**
	 * The smoothing of the camera movement while a mouse button or a finger is down:
	 * the time the camera needs to catch up with the pointer, as a fraction of 100 ms.
	 * 0 = the camera follows the pointer exactly. (default: 0.5, about 50 ms)
	 *
	 * The camera stops shortly after the pointer stops and a drag moves the camera
	 * by the pointer distance times the speed setting, whatever this value is.
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
	 * For a perspective camera, 0.5 means that the point under the pointer at the depth of the target
	 * follows the pointer exactly, for mouse and touch. (default: 0.5)
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
	 * 0.5 = one full turn per canvas height dragged, for mouse and touch. (default: 0.5)
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
	 * At 0.5, one notch of the mouse wheel changes the distance to the target by about 12 %,
	 * on any display refresh rate.
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
