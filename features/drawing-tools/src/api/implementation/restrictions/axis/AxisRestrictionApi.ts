import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { AxisRestriction } from '../../../../business/implementation/managers/interaction/restrictions/axis/AxisRestriction';

export class AxisRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    readonly #axisRestriction: AxisRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: AxisRestriction) {
        super(restriction);
        this.#axisRestriction = restriction;
    }

    // #endregion Constructors (1)
}