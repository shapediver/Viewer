import { AbstractSnapRestrictionApi } from '../../AbstractSnapRestrictionApi';
import { AxisRestriction } from '../../../../../business/implementation/managers/interaction/restrictions/plane/snap/AxisRestriction';

export class AxisRestrictionApi extends AbstractSnapRestrictionApi {
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