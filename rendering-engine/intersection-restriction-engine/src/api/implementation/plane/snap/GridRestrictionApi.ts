import {GridRestriction} from "../../../../implementation/restrictions/plane/snap/GridRestriction";
import {AbstractSnapRestrictionApi} from "../../AbstractSnapRestrictionApi";

export class GridRestrictionApi extends AbstractSnapRestrictionApi {
	// #region Properties (1)

	readonly #gridRestriction: GridRestriction;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(restriction: GridRestriction) {
		super(restriction);
		this.#gridRestriction = restriction;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get gridUnit(): number {
		return this.#gridRestriction.gridUnit;
	}

	public set gridUnit(value: number) {
		this.#gridRestriction.gridUnit = value;
	}

	public get gridUnitEditable(): boolean {
		return this.#gridRestriction.gridUnitEditable;
	}

	// #endregion Public Getters And Setters (3)
}
