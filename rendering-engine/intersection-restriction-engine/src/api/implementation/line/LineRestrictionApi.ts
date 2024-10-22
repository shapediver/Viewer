import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { LineRestriction } from '../../../implementation/restrictions/line/LineRestriction';
import { vec3 } from 'gl-matrix';

export class LineRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    readonly #lineRestriction: LineRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: LineRestriction) {
        super(restriction);
        this.#lineRestriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get point1(): vec3 {
        return this.#lineRestriction.point1;
    }

    public get point2(): vec3 {
        return this.#lineRestriction.point2;
    }

    public get radius(): number {
        return this.#lineRestriction.radius;
    }

    // #endregion Public Getters And Setters (3)
}