import {ResOutput} from "@shapediver/sdk.geometry-api-sdk-v2";
import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {ISessionOutputData} from "../interfaces/ISessionOutputData";

export class SessionOutputData
	extends AbstractTreeNodeData
	implements ISessionOutputData
{
	// #region Properties (1)

	#responseOutput: ResOutput;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(responseOutput: ResOutput, id?: string, version?: string) {
		super(id, version);
		this.#responseOutput = responseOutput;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get responseOutput(): ResOutput {
		return this.#responseOutput;
	}

	public set responseOutput(value: ResOutput) {
		this.#responseOutput = value;
	}

	// #endregion Public Getters And Setters (2)

	// #region Public Methods (1)

	public clone(): ISessionOutputData {
		return new SessionOutputData(
			this.responseOutput,
			this.id,
			this.version,
		);
	}

	// #endregion Public Methods (1)
}
