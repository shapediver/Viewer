import { AbstractTreeNodeData, ITransformation, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { mat4 } from 'gl-matrix';
export class InteractionData extends AbstractTreeNodeData {
    // #region Properties (8)

    #drag: boolean = false;
    #hover: boolean = false;
    #select: boolean = false;

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        drag: boolean,
        hover: boolean,
        select: boolean,
        id?: string
    ) {
        super(id);
        this.#hover = hover;
        this.#drag = drag;
        this.#select = select;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get drag(): boolean {
        return this.#drag;
    }

    public set drag(value: boolean) {
        this.#drag = value;
    }

    public get hover(): boolean {
        return this.#hover;
    }

    public set hover(value: boolean) {
        this.#hover = value;
    }

    public get select(): boolean {
        return this.#select;
    }

    public set select(value: boolean) {
        this.#select = value;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new InteractionData(this.#drag, this.#hover, this.#select, this.id);
    }

    // #endregion Public Methods (5)
}
