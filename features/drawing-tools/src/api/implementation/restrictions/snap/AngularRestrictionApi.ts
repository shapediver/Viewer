import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { AngularRestriction } from '../../../../business/implementation/restrictions/snap/AngularRestriction';
import { vec3 } from 'gl-matrix';

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

    // #region Public Getters And Setters (4)

    public get angleStep(): number {
        return this._angularRestriction.angleStep;
    }

    public set angleStep(value: number) {
        this._angularRestriction.angleStep = value;
    }

    public get normal(): vec3 {
        return this._angularRestriction.normal;
    }

    public set normal(value: vec3) {
        this._angularRestriction.normal = value;
    }

    // #endregion Public Getters And Setters (4)
}