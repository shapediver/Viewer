import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

import { ISession } from './interfaces/ISession';

export class SessionData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor( 
        private _session: ISession,
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
    public get session(): ISession {
		return this._session;
	}

    /**
     * Setter session
     * @param {ISession} value
     */
    public set session(value: ISession) {
		this._session = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        // TODO real deep copy
        return new SessionData(this.session, this._id);
    }

    // #endregion Public Methods (1)
}
