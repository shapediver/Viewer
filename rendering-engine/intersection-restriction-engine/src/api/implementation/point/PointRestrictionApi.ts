import {vec3} from "gl-matrix";
import {PointRestriction} from "../../../implementation/restrictions/point/PointRestriction";
import {AbstractRestrictionApi} from "../AbstractRestrictionApi";

export class PointRestrictionApi extends AbstractRestrictionApi {
	// #region Properties (1)

	readonly #pointRestriction: PointRestriction;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(restriction: PointRestriction) {
		super(restriction);
		this.#pointRestriction = restriction;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get point(): vec3 {
		return this.#pointRestriction.point;
	}

	public get radius(): number {
		return this.#pointRestriction.radius;
	}

	// #endregion Public Getters And Setters (2)
}
