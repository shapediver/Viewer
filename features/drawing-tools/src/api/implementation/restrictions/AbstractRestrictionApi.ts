import { IRestrictionApi } from '../../interfaces/IRestrictionApi';
import { IRestrictionBase } from '../../../business/interfaces/IRestrictionBase';

export abstract class AbstractRestrictionApi implements IRestrictionApi {
    // #region Properties (1)

    readonly #restriction: IRestrictionBase;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: IRestrictionBase) {
        this.#restriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get enabled(): boolean {
        return this.#restriction.enabled;
    }

    public set enabled(value: boolean) {
        this.#restriction.enabled = value;
    }

    public get id(): string {
        return this.#restriction.id;
    }

    // #endregion Public Getters And Setters (5)
}