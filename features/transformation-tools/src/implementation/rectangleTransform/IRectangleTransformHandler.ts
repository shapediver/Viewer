import {vec3} from "gl-matrix";

/**
 * Common interface shared by all three RectangleTransform sub-handlers
 * (scaling, rotation, translation).
 */
export interface IRectangleTransformHandler {
	/** Release all resources (drawing tools, interaction engines, scene nodes). */
	close(): void;

	/**
	 * Synchronize the handler's visual state to updated rectangle points.
	 * For scaling/rotation this repositions the DT handles; for translation
	 * this rebuilds the invisible drag plane.
	 * @param localPoints The current 8-point conceptual array in plane-LS.
	 * @param temporary   Whether the update should be staged (true) or committed (false).
	 */
	recompute(localPoints: vec3[], temporary: boolean): void;
}
