import { AbstractTreeNodeData, ITransformation, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { mat4 } from 'gl-matrix';
export class InteractionData extends AbstractTreeNodeData {
    // #region Properties (8)

    #interactionTypes: {
        [key: string]: boolean
    } = {};

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        interactionTypes: {
            [key: string]: boolean
        },
        id?: string
    ) {
        super(id);
        this.#interactionTypes = interactionTypes;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    public get interactionTypes(): { [key: string]: boolean } {
        return this.#interactionTypes;
    }

    public set interactionTypes(value: { [key: string]: boolean }) {
        this.#interactionTypes = value;
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new InteractionData(this.#interactionTypes, this.id);
    }

    // #endregion Public Methods (5)
}
