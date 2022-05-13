import { IBox } from '@shapediver/viewer.shared.math'
import { mat4, vec2, vec3 } from 'gl-matrix'
import { CAMERA_TYPE } from '@shapediver/viewer.rendering-engine.camera-engine'

/**
 * The api for a camera, please see the definitions for the [perspective camera api]{@link IPerspectiveCameraApi} and the [orthographic camera api]{@link IOrthographicCameraApi} as this is just a shared interface for both.
 * A camera can be created by calling the corresponding method in the {@link IViewportApi}.
 * A camera has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface ICameraApi {
    // #region Properties (14)

    /**
     * The id of the camera.
     */
    readonly id: string;

    /**
     * The type of camera that is being used.
     */
    readonly type: CAMERA_TYPE;
    

    /**
     * Option to automatically adjust the camera to the size of the scene whenever the session is customized.
     */
    autoAdjust: boolean;

    /**
     * The standard duration for camera movements.
     */
    cameraMovementDuration: number;

    /**
     * The default position of the camera.
     */
    defaultPosition: vec3;

    /**
     * The default target of the camera.
     */
    defaultTarget: vec3;

    /**
     * Option to enable / disable the movement of the camera.
     */
    enabled: boolean;

    /**
     * The name of the camera.
     */
    name?: string;

    /**
     * Optional order property for the camera.
     */
    order?: number;

    /**
     * The current position of the camera.
     */
    position: vec3;

    /**
     * Option to reset the camera position and target to their defaults whenever the mouse/touch up event is fired.
     */
    revertAtMouseUp: boolean;

    /**
     * The standard duration for revertAtMouseUp movements.
     */
    revertAtMouseUpDuration: number;

    /**
     * The current target of the camera.
     */
    target: vec3;

    /**
     * The factor that is used when the zoomTo function is called.
     */
    zoomToFactor: number;

    // #endregion Properties (14)

    // #region Public Methods (7)

    /**
     * Let the camera follow a path from different position and target pairs to another.
     * 
     * @param path The defined path.
     * @param options Various options to be adjusted.
     */
    animate(path: { position: vec3, target: vec3 }[], options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    
    /**
     * Calculate the position for our {@link zoomTo} method.
     * A specific target can be provided, as well as a specific camera startingPosition and startingTarget.
     * If no target is provided, the current bounding box is used.
     * If not startingPosition and startingTarget are provided, the current camera position and target are used.
     * 
     * @param zoomTarget The target to zoom to.
     * @param startingPosition The starting position of the camera.
     * @param startingTarget The starting target of the camera.
     */
    calculateZoomTo(zoomTarget?: IBox, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; };
    
    /**
     * Project a point in the scene to a point on the screen.
     * 
     * @param p The point in the scene to project.
     */
    project(p: vec3): vec2;
    
    /**
     * Reset the camera to its default position and target.
     * 
     * @param options Various options to be adjusted.
     */
    reset(options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    
    /**
     * Set the camera to its a specific position and target.
     * 
     * @param options Various options to be adjusted.
     */
    set(position: vec3, target: vec3, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;
    
    /**
     * Project a point on the screen to a point in the scene.
     * 
     * @param p The point on the screen to project.
     */
    unproject(p: vec3): vec3;
    
    /**
     * Zoom in on a specific part of the scene, or the whole scene (default).
     * 
     * @param zoomTarget The target to zoom to.
     * @param options Various options to be adjusted.
     */
    zoomTo(zoomTarget?: IBox, options?: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function }): Promise<boolean>;

    // #endregion Public Methods (7)
}