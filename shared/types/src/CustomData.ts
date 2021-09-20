import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class CustomData extends AbstractTreeNodeData {
    // #region Properties (1)

    #data: { [key: string]: any };

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        data: { [key: string]: any },
        id?: string
    ) {
        super(id);
        this.#data = data;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get data(): { [key: string]: any } {
        return this.#data;
    }

    public set data(value: { [key: string]: any }) {
        this.#data = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new CustomData({ ...this.data }, this.id);
    }

    // #endregion Public Methods (1)
}
