import {vec3} from "gl-matrix";
import {IViewportEvent} from "./IViewportEvent";

/**
 * Definition of the scene event.
 * These events are sent for scene specific events ({@link EVENTTYPE_SCENE}).
 */
export interface ISceneEvent extends IViewportEvent {
	// #region Properties (1)

	/**
	 * The bounding box of the scene.
	 */
	boundingBox: {min: vec3; max: vec3};

	// #endregion Properties (1)
}
