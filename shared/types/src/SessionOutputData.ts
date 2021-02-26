import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

import { ISessionOutput } from './interfaces/ISessionOutput';

export class SessionOutputData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor(
        private _sessionOutput: ISessionOutput,
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter sessionOutput
     * @return {ISessionOutput}
     */
    public get sessionOutput(): ISessionOutput {
		return this._sessionOutput;
	}

    /**
     * Setter sessionOutput
     * @param {ISessionOutput} value
     */
    public set sessionOutput(value: ISessionOutput) {
		this._sessionOutput = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        // TODO real deep copy
        return new SessionOutputData(this.sessionOutput, this._id);
    }

    // #endregion Public Methods (1)
}
