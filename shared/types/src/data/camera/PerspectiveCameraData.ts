import { AbstractTreeNodeData, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'

export class PerspectiveCameraData extends AbstractTreeNodeData {
    // #region Properties (4)

    #aspect?: number;
    #far?: number;
    #fov?: number;
    #near?: number;
    #parent: TreeNode;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(parent: TreeNode, id?: string) {
        super(id);
        this.#parent = parent;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get aspect(): number | undefined {
        return this.#aspect;
    }

    public set aspect(value: number | undefined) {
        this.#aspect = value;
    }

    public get far(): number | undefined {
        return this.#far;
    }

    public set far(value: number | undefined) {
        this.#far = value;
    }

    public get fov(): number | undefined {
        return this.#fov;
    }

    public set fov(value: number | undefined) {
        this.#fov = value;
    }

    public get near(): number | undefined {
        return this.#near;
    }

    public set near(value: number | undefined) {
        this.#near = value;
    }

    public get parent(): TreeNode {
        return this.#parent;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        const camera = new PerspectiveCameraData(this.parent, this.id);
        camera.fov = this.#fov;
        camera.aspect = this.#aspect;
        camera.near = this.#near;
        camera.far = this.#far;
        return camera;
    }

    // #endregion Public Methods (1)
}
