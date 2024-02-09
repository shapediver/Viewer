import { IRestriction } from '../../../business/interfaces/IRestriction';
import { IRestrictionApi } from '../../interfaces/IRestrictionApi';

export abstract class AbstractRestrictionApi implements IRestrictionApi {
    // #region Properties (1)

    private readonly _restriction: IRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: IRestriction) {
        this._restriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get enabled(): boolean {
        return this._restriction.enabled;
    }

    public set enabled(value: boolean) {
        this._restriction.enabled = value;
    }

    public get id(): string {
        return this._restriction.id;
    }

    // #endregion Public Getters And Setters (3)
}