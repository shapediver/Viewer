import { AbstractRestrictionApi } from '../../AbstractRestrictionApi';
import { GridRestriction } from '../../../../../business/implementation/restrictions/plane/snap/GridRestriction';

export class GridRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    private readonly _gridRestriction: GridRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: GridRestriction) {
        super(restriction);
        this._gridRestriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get gridUnit(): number {
        return this._gridRestriction.gridUnit;
    }

    public set gridUnit(value: number) {
        this._gridRestriction.gridUnit = value;
    }

    // #endregion Public Getters And Setters (2)
}