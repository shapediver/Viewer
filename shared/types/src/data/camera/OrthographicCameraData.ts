import { AbstractTreeNodeData, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'

export class OrthographicCameraData extends AbstractTreeNodeData {
    // #region Properties (6)

    #bottom?: number;
    #far?: number;
    #left?: number;
    #near?: number;
    #right?: number;
    #top?: number;
    #parent: TreeNode;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(parent: TreeNode, id?: string) {
        super(id);
        this.#parent = parent;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get bottom(): number | undefined {
        return this.#bottom;
    }

    public set bottom(value: number | undefined) {
        this.#bottom = value;
    }

    public get far(): number | undefined {
        return this.#far;
    }

    public set far(value: number | undefined) {
        this.#far = value;
    }

    public get left(): number | undefined {
        return this.#left;
    }

    public set left(value: number | undefined) {
        this.#left = value;
    }

    public get near(): number | undefined {
        return this.#near;
    }

    public set near(value: number | undefined) {
        this.#near = value;
    }

    public get right(): number | undefined {
        return this.#right;
    }

    public set right(value: number | undefined) {
        this.#right = value;
    }

    public get top(): number | undefined {
        return this.#top;
    }

    public set top(value: number | undefined) {
        this.#top = value;
    }
    
    public get parent(): TreeNode {
        return this.#parent;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        const camera = new OrthographicCameraData(this.parent, this.id);
        camera.bottom = this.#bottom;
        camera.top = this.#top;
        camera.left = this.#left;
        camera.right = this.#right;
        camera.near = this.#near;
        camera.far = this.#far;
        return camera;
    }

    // #endregion Public Methods (1)
}
