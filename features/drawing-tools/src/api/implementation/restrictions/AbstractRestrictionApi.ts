import { IRestrictionApi } from '../../interfaces/IRestrictionApi';
import { IRestrictionBase } from '../../../business/interfaces/IRestrictionBase';

export abstract class AbstractRestrictionApi implements IRestrictionApi {
    // #region Properties (1)

    private readonly _restriction: IRestrictionBase;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: IRestrictionBase) {
        this._restriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get enabled(): boolean {
        return this._restriction.enabled;
    }

    public set enabled(value: boolean) {
        this._restriction.enabled = value;
    }

    public get id(): string {
        return this._restriction.id;
    }

    public get showVisualization(): boolean {
        return this._restriction.showVisualization;
    }

    public set showVisualization(value: boolean) {
        this._restriction.showVisualization = value;
    }

    // #endregion Public Getters And Setters (5)
}