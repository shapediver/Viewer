import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { ISessionApiData } from '../../../interfaces/session/data/ISessionApiData';
import { ISessionApi } from '../../../interfaces/session/ISessionApi';

export class SessionApiData extends AbstractTreeNodeData implements ISessionApiData {
    // #region Properties (1)

    #api: ISessionApi;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a SessionApi data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        api: ISessionApi,
        id?: string
    ) {
        super(id);
        this.#api = api;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get api(): ISessionApi {
        return this.#api;
    }

    public set api(value: ISessionApi) {
        this.#api = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ISessionApiData {
        return new SessionApiData(this.api, this.id);
    }

    // #endregion Public Methods (1)
}
