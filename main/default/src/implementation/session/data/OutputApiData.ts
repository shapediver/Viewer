import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IOutputApiData } from '../../../interfaces/session/data/IOutputApiData';
import { IOutputApi } from '../../../interfaces/session/IOutputApi';

export class OutputApiData extends AbstractTreeNodeData implements IOutputApiData {
    // #region Properties (1)

    #api: IOutputApi;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a OutputApi data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        api: IOutputApi,
        id?: string
    ) {
        super(id);
        this.#api = api;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get api(): IOutputApi {
        return this.#api;
    }

    public set api(value: IOutputApi) {
        this.#api = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): IOutputApiData {
        return new OutputApiData(this.api, this.id);
    }

    // #endregion Public Methods (1)
}
