import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IBoneData } from '../../interfaces/data/IBoneData';

export class BoneData extends AbstractTreeNodeData implements IBoneData {

    // #region Constructors (1)

    /**
     * Creates a Bone data node.
     * 
     * @param id the id
     */
    constructor(
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): IBoneData {
        return new BoneData(this.id);
    }

    // #endregion Public Methods (1)
}
