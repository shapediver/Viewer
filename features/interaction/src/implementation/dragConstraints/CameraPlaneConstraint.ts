import {vec3} from "gl-matrix";
import {type IDragConstraint} from "../../interfaces/utils/IDragConstraint";

/**
 * The camera plane constraint is used for dragging and allows to specify that the dragging happens on a plane parallel to the camera plane that passes through the origin of the node being dragged.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 *
 * @deprecated This class is deprecated and will be removed in the future. Please use the `CameraPlaneRestriction` instead.
 */
export class CameraPlaneConstraint implements IDragConstraint {
	// #region Properties (1)

	#rotation: {axis: vec3; angle: number};

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(_rotation?: {axis: vec3; angle: number}) {
		this.#rotation = _rotation || {
			axis: vec3.fromValues(0, 0, 1),
			angle: 0,
		};
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (1)

	public get rotation(): {axis: vec3; angle: number} | undefined {
		return this.#rotation;
	}

	// #endregion Public Getters And Setters (1)
}
