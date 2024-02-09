import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { GridRestriction } from '../../../../business/implementation/restrictions/snap/GridRestriction';
import { vec3 } from 'gl-matrix';

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

    // #region Public Getters And Setters (8)

    public get gridSize(): number {
        return this._gridRestriction.gridSize;
    }

    public set gridSize(value: number) {
        this._gridRestriction.gridSize = value;
    }

    public get gridUnit(): number {
        return this._gridRestriction.gridUnit;
    }

    public set gridUnit(value: number) {
        this._gridRestriction.gridUnit = value;
    }

    public get normal(): vec3 {
        return this._gridRestriction.normal;
    }

    public set normal(value: vec3) {
        this._gridRestriction.normal = value;
    }

    public get origin(): vec3 {
        return this._gridRestriction.origin;
    }

    public set origin(value: vec3) {
        this._gridRestriction.origin = value;
    }

    // #endregion Public Getters And Setters (8)
}