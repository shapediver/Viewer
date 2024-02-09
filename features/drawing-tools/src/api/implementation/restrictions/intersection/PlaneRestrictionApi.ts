import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { PlaneRestriction } from '../../../../business/implementation/restrictions/intersection/PlaneRestriction';
import { vec3 } from 'gl-matrix';

export class PlaneRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    private readonly _planeRestriction: PlaneRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: PlaneRestriction) {
        super(restriction);
        this._planeRestriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get gridSize(): number {
        return this._planeRestriction.gridSize;
    }

    public set gridSize(value: number) {
        this._planeRestriction.gridSize = value;
    }

    public get normal(): vec3 {
        return this._planeRestriction.normal;
    }

    public set normal(value: vec3) {
        this._planeRestriction.normal = value;
    }

    public get origin(): vec3 {
        return this._planeRestriction.origin;
    }

    public set origin(value: vec3) {
        this._planeRestriction.origin = value;
    }

    // #endregion Public Getters And Setters (4)
}