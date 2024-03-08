import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { AngularRestrictionApi } from './snap/AngularRestrictionApi';
import { GridRestrictionApi } from './snap/GridRestrictionApi';
import { PlaneRestriction } from '../../../../business/implementation/restrictions/plane/PlaneRestriction';
import { vec3 } from 'gl-matrix';

export class PlaneRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (3)

    readonly #angularRestrictionApi: AngularRestrictionApi;
    readonly #gridRestrictionApi: GridRestrictionApi;
    private readonly _planeRestriction: PlaneRestriction;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(restriction: PlaneRestriction) {
        super(restriction);
        this._planeRestriction = restriction;

        this.#gridRestrictionApi = new GridRestrictionApi(restriction.gridRestriction);
        this.#angularRestrictionApi = new AngularRestrictionApi(restriction.angularRestriction);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (8)

    public get angularRestrictionApi(): AngularRestrictionApi {
        return this.#angularRestrictionApi;
    }

    public get gridRestrictionApi(): GridRestrictionApi {
        return this.#gridRestrictionApi;
    }

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

    // #endregion Public Getters And Setters (8)
}