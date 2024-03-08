import { AbstractRestrictionApi } from '../../AbstractRestrictionApi';
import { AngularRestriction } from '../../../../../business/implementation/restrictions/plane/snap/AngularRestriction';

export class AngularRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    private readonly _angularRestriction: AngularRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: AngularRestriction) {
        super(restriction);
        this._angularRestriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get angleStep(): number {
        return this._angularRestriction.angleStep;
    }

    public set angleStep(value: number) {
        this._angularRestriction.angleStep = value;
    }

    // #endregion Public Getters And Setters (2)
}