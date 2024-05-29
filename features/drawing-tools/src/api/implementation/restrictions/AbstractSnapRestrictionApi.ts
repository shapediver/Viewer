import { ISnapRestriction } from '../../../business/interfaces/ISnapRestriction';
import { ISnapRestrictionApi } from '../../interfaces/ISnapRestrictionApi';
import { AbstractRestrictionApi } from './AbstractRestrictionApi';

export abstract class AbstractSnapRestrictionApi extends AbstractRestrictionApi implements ISnapRestrictionApi {
    // #region Properties (1)

    readonly #restriction: ISnapRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: ISnapRestriction) {
        super(restriction);
        this.#restriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get enabledEditable(): boolean {
        return this.#restriction.enabledEditable;
    }

    public get priority(): number {
        return this.#restriction.priority;
    }

    public set priority(value: number) {
        this.#restriction.priority = value;
    }

    // #endregion Public Getters And Setters (3)
}