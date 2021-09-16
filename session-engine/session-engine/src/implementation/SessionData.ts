import { ShapeDiverResponseBase as ShapeDiverResponse } from '@shapediver/api.geometry-api-dto-v1'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class SessionData extends AbstractTreeNodeData {
    // #region Constructors (1)
    #session: ShapeDiverResponse;

    constructor( 
        session: ShapeDiverResponse,
        id?: string
    ) {
        super(id);
        this.#session = session;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get session(): ShapeDiverResponse {
		return this.#session;
	}

    public set session(value: ShapeDiverResponse) {
		this.#session = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new SessionData(this.session, this.id);
    }

    // #endregion Public Methods (1)
}
