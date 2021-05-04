import { ShapeDiverResponseBase as ShapeDiverResponse } from '@shapediver/api.geometry-api-dto-v1';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

export class SessionData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor( 
        private _session: ShapeDiverResponse,
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter session
     * @return {ISession}
     */
    public get session(): ShapeDiverResponse {
		return this._session;
	}

    /**
     * Setter session
     * @param {ISession} value
     */
    public set session(value: ShapeDiverResponse) {
		this._session = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        // real deep copy https://shapediver.atlassian.net/browse/SS-2959
        return new SessionData(this.session, this._id);
    }

    // #endregion Public Methods (1)
}
