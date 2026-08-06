import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {type ISessionApiData} from "../../interfaces/data/ISessionApiData";
import {type ISessionApi} from "../../interfaces/ISessionApi";

export class SessionApiData
	extends AbstractTreeNodeData
	implements ISessionApiData
{
	// #region Properties (1)

	#api: ISessionApi;

	// #endregion Properties (1)

	// #region Constructors (1)

	/**
	 * Creates a SessionApi data node.
	 *
	 * @param api the session API
	 * @param id the id
	 */
	constructor(api: ISessionApi, id?: string, version?: string) {
		super(id, version);
		this.#api = api;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get api(): ISessionApi {
		return this.#api;
	}

	public set api(value: ISessionApi) {
		this.#api = value;
	}

	// #endregion Public Getters And Setters (2)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): ISessionApiData {
		return new SessionApiData(this.api, this.id, this.version);
	}

	// #endregion Public Methods (1)
}
