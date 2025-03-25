import {vec3} from "gl-matrix";
import {IDragConstraint} from "../../interfaces/utils/IDragConstraint";

/**
 * The plane constraint is used for dragging and allows to specify a plane on which an object can be dragged.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 *
 * @deprecated This class is deprecated and will be removed in the future. Please use the `PlaneRestriction` instead.
 */
export class PlaneConstraint implements IDragConstraint {
	// #region Properties (3)

	#coplanarPoint?: vec3;
	#normal: vec3;
	#rotation: {
		axis: vec3;
		angle: number;
	};

	// #endregion Properties (3)

	// #region Constructors (1)

	/**
	 * @param _normal the normal vector of the plane
	 * @param _coplanarPoint a coplanar point on the plane
	 * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
	 */
	constructor(
		_normal: vec3,
		_coplanarPoint?: vec3,
		_rotation?: {
			axis: vec3;
			angle: number;
		},
	) {
		this.#normal = _normal;
		this.#coplanarPoint = _coplanarPoint;
		this.#rotation = _rotation || {
			axis: vec3.fromValues(0, 0, 1),
			angle: 0,
		};
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get coplanarPoint(): vec3 | undefined {
		return this.#coplanarPoint;
	}

	public get normal(): vec3 {
		return this.#normal;
	}

	public get rotation(): {axis: vec3; angle: number} | undefined {
		return this.#rotation;
	}

	// #endregion Public Getters And Setters (3)
}
