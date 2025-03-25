import {IRestriction} from "../../interfaces/IRestriction";
import {IRestrictionApi} from "../interfaces/IRestrictionApi";

export abstract class AbstractRestrictionApi implements IRestrictionApi {
	// #region Properties (1)

	readonly #restriction: IRestriction;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(restriction: IRestriction) {
		this.#restriction = restriction;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get enabled(): boolean {
		return this.#restriction.enabled;
	}

	public set enabled(value: boolean) {
		this.#restriction.enabled = value;
	}

	public get hideable(): boolean {
		return this.#restriction.hideable;
	}

	public set hideable(value: boolean) {
		this.#restriction.hideable = value;
	}

	public get priority(): number {
		return this.#restriction.priority;
	}

	public get id(): string {
		return this.#restriction.id;
	}

	// #endregion Public Getters And Setters (3)
}
