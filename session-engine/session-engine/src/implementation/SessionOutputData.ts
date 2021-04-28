import { ShapeDiverResponseOutput } from '@shapediver/api.geometry-api-dto-v1';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

export class SessionOutputData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor(
        private _sessionOutput: ShapeDiverResponseOutput,
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter sessionOutput
     * @return {ShapeDiverResponseOutput}
     */
    public get sessionOutput(): ShapeDiverResponseOutput {
		return this._sessionOutput;
	}

    /**
     * Setter sessionOutput
     * @param {ShapeDiverResponseOutput} value
     */
    public set sessionOutput(value: ShapeDiverResponseOutput) {
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
