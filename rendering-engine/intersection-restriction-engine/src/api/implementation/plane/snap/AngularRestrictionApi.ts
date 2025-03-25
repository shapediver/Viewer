import {AngularRestriction} from "../../../../implementation/restrictions/plane/snap/AngularRestriction";
import {AbstractSnapRestrictionApi} from "../../AbstractSnapRestrictionApi";

export class AngularRestrictionApi extends AbstractSnapRestrictionApi {
	// #region Properties (1)

	readonly #angularRestriction: AngularRestriction;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(restriction: AngularRestriction) {
		super(restriction);
		this.#angularRestriction = restriction;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get angleStep(): number {
		return this.#angularRestriction.angleStep;
	}

	public set angleStep(value: number) {
		this.#angularRestriction.angleStep = value;
	}

	public get angleStepEditable(): boolean {
		return this.#angularRestriction.angleStepEditable;
	}

	// #endregion Public Getters And Setters (3)
}
