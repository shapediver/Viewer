import { ShapeDiverResponseOutput } from '@shapediver/sdk.geometry-api-sdk-v2';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { ISessionOutputData } from '../interfaces/ISessionOutputData';

export class SessionOutputData extends AbstractTreeNodeData implements ISessionOutputData {
    // #region Properties (1)

    #responseOutput: ShapeDiverResponseOutput;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        responseOutput: ShapeDiverResponseOutput,
        id?: string
    ) {
        super(id);
        this.#responseOutput = responseOutput;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get responseOutput(): ShapeDiverResponseOutput {
		return this.#responseOutput;
	}

    public set responseOutput(value: ShapeDiverResponseOutput) {
		this.#responseOutput = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ISessionOutputData {
        return new SessionOutputData(this.responseOutput, this.id);
    }

    // #endregion Public Methods (1)
}
