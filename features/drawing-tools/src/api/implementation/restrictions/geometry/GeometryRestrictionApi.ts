import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { GeometryRestriction } from '../../../../business/implementation/managers/interaction/restrictions/geometry/GeometryRestriction';

export class GeometryRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    readonly #geometryRestriction: GeometryRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: GeometryRestriction) {
        super(restriction);
        this.#geometryRestriction = restriction;
    }

    public get snapToVertices(): boolean {
        return this.#geometryRestriction.snapToVertices;
    }

    public set snapToVertices(value: boolean) {
        this.#geometryRestriction.snapToVertices = value;
    }

    public get snapToEdges(): boolean {
        return this.#geometryRestriction.snapToEdges;
    }

    public set snapToEdges(value: boolean) {
        this.#geometryRestriction.snapToEdges = value;
    }

    public get snapToFaces(): boolean {
        return this.#geometryRestriction.snapToFaces;
    }

    public set snapToFaces(value: boolean) {
        this.#geometryRestriction.snapToFaces = value;
    }

    // #endregion Constructors (1)
}