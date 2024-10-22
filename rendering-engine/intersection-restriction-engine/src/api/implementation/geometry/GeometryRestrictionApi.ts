import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { GeometryRestriction } from '../../../implementation/restrictions/geometry/GeometryRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';

export class GeometryRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    readonly #geometryRestriction: GeometryRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: GeometryRestriction) {
        super(restriction);
        this.#geometryRestriction = restriction;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

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

    public get snapToVertices(): boolean {
        return this.#geometryRestriction.snapToVertices;
    }

    public set snapToVertices(value: boolean) {
        this.#geometryRestriction.snapToVertices = value;
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (1)

    public updateNodes(nodes: ITreeNode[]): void {
        this.#geometryRestriction.updateNodes(nodes);
    }

    // #endregion Public Methods (1)
}