import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { IInstanceMatricesData } from '../../interfaces/data/IInstanceMatricesData';
import { mat4 } from 'gl-matrix';

export class InstanceMatricesData extends AbstractTreeNodeData implements IInstanceMatricesData {
    // #region Properties (1)

    #instanceMatrices: mat4[] = [];

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a instanceMatrices data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        instanceMatrices: mat4[] = [],
        id?: string,
        version?: string
    ) {
        super(id, version);
        this.#instanceMatrices = instanceMatrices;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get instanceMatrices(): mat4[] {
        return this.#instanceMatrices;
    }

    public set instanceMatrices(value: mat4[]) {
        this.#instanceMatrices = value;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): IInstanceMatricesData {
        return new InstanceMatricesData(this.instanceMatrices, this.id, this.version);
    }

    // #endregion Public Methods (1)
}
