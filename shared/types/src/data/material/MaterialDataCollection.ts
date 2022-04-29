import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { AbstractMaterialData } from './AbstractMaterialData';

export class MaterialDataCollection extends AbstractTreeNodeData {
    // #region Properties (1)

    #materials: AbstractMaterialData[] = [];

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a material collection data node.
     * 
     * @param materials the materials as an array
     * @param id the id
     */
    constructor(
        materials: AbstractMaterialData[] = [],
        id?: string
    ) {
        super(id);
        this.#materials = materials;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get materials():  AbstractMaterialData[] {
        return this.#materials;
    }

    public set materials(value:  AbstractMaterialData[]) {
        this.#materials = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new MaterialDataCollection(this.materials, this.id);
    }

    // #endregion Public Methods (1)
}
