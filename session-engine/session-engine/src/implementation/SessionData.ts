import {ResBase} from "@shapediver/sdk.geometry-api-sdk-v2";
import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {ISessionData} from "../interfaces/ISessionData";

export class SessionData extends AbstractTreeNodeData implements ISessionData {
	// #region Properties (1)

	#responseDto: ResBase;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(responseDto: ResBase, id?: string, version?: string) {
		super(id, version);
		this.#responseDto = responseDto;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get responseDto(): ResBase {
		return this.#responseDto;
	}

	public set responseDto(value: ResBase) {
		this.#responseDto = value;
	}

	// #endregion Public Getters And Setters (2)

	// #region Public Methods (1)

	public clone(): ISessionData {
		return new SessionData(this.responseDto, this.id, this.version);
	}

	// #endregion Public Methods (1)
}
