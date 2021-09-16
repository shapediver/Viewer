import { ShapeDiverResponseOutput } from '@shapediver/api.geometry-api-dto-v1'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class SessionOutputData extends AbstractTreeNodeData {
    #sessionOutput: ShapeDiverResponseOutput;

    // #region Constructors (1)

    constructor(
        sessionOutput: ShapeDiverResponseOutput,
        id?: string
    ) {
        super(id);
        this.#sessionOutput = sessionOutput;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get sessionOutput(): ShapeDiverResponseOutput {
		return this.#sessionOutput;
	}

    public set sessionOutput(value: ShapeDiverResponseOutput) {
		this.#sessionOutput = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new SessionOutputData(this.sessionOutput, this.id);
    }

    // #endregion Public Methods (1)
}
