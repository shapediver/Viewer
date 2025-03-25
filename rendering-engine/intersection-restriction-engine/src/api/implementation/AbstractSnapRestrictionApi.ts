import {ISnapRestriction} from "../../interfaces/ISnapRestriction";
import {ISnapRestrictionApi} from "../interfaces/ISnapRestrictionApi";

export abstract class AbstractSnapRestrictionApi
	implements ISnapRestrictionApi
{
	// #region Properties (1)

	readonly #restriction: ISnapRestriction;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(restriction: ISnapRestriction) {
		this.#restriction = restriction;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (6)

	public get enabled(): boolean {
		return this.#restriction.enabled;
	}

	public set enabled(value: boolean) {
		this.#restriction.enabled = value;
	}

	public get enabledEditable(): boolean {
		return this.#restriction.enabledEditable;
	}

	public get id(): string {
		return this.#restriction.id;
	}

	public get priority(): number {
		return this.#restriction.priority;
	}

	public set priority(value: number) {
		this.#restriction.priority = value;
	}

	// #endregion Public Getters And Setters (6)
}
