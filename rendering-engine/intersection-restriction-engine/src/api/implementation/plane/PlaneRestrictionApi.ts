import {vec3} from "gl-matrix";
import {PlaneRestriction} from "../../../implementation/restrictions/plane/PlaneRestriction";
import {AbstractRestrictionApi} from "../AbstractRestrictionApi";
import {AngularRestrictionApi} from "./snap/AngularRestrictionApi";
import {AxisRestrictionApi} from "./snap/AxisRestrictionApi";
import {GridRestrictionApi} from "./snap/GridRestrictionApi";

export class PlaneRestrictionApi extends AbstractRestrictionApi {
	// #region Properties (4)

	readonly #angularRestrictionApi: AngularRestrictionApi;
	readonly #axisRestrictionApi: AxisRestrictionApi;
	readonly #gridRestrictionApi: GridRestrictionApi;
	readonly #planeRestriction: PlaneRestriction;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(restriction: PlaneRestriction) {
		super(restriction);
		this.#planeRestriction = restriction;

		this.#gridRestrictionApi = new GridRestrictionApi(
			restriction.gridRestriction,
		);
		this.#angularRestrictionApi = new AngularRestrictionApi(
			restriction.angularRestriction,
		);
		this.#axisRestrictionApi = new AxisRestrictionApi(
			restriction.axisRestriction,
		);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (9)

	public get angularRestrictionApi(): AngularRestrictionApi {
		return this.#angularRestrictionApi;
	}

	public get axisRestrictionApi(): AxisRestrictionApi {
		return this.#axisRestrictionApi;
	}

	public get gridRestrictionApi(): GridRestrictionApi {
		return this.#gridRestrictionApi;
	}

	public get origin(): vec3 {
		return this.#planeRestriction.origin;
	}

	public set origin(value: vec3) {
		this.#planeRestriction.origin = value;
	}

	public get vectorU(): vec3 {
		return this.#planeRestriction.vectorU;
	}

	public set vectorU(value: vec3) {
		this.#planeRestriction.vectorU = value;
	}

	public get vectorV(): vec3 {
		return this.#planeRestriction.vectorV;
	}

	public set vectorV(value: vec3) {
		this.#planeRestriction.vectorV = value;
	}

	// #endregion Public Getters And Setters (9)
}
