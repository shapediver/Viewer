import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {type IOutputApiData} from "../../interfaces/data/IOutputApiData";
import {type IOutputApi} from "../../interfaces/IOutputApi";

export class OutputApiData
	extends AbstractTreeNodeData
	implements IOutputApiData
{
	// #region Properties (1)

	#api: IOutputApi;

	// #endregion Properties (1)

	// #region Constructors (1)

	/**
	 * Creates a OutputApi data node.
	 *
	 * @param _data the data as key- value pairs
	 * @param id the id
	 */
	constructor(api: IOutputApi, id?: string, version?: string) {
		super(id, version);
		this.#api = api;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (2)

	public get api(): IOutputApi {
		return this.#api;
	}

	public set api(value: IOutputApi) {
		this.#api = value;
	}

	// #endregion Public Getters And Setters (2)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): IOutputApiData {
		return new OutputApiData(this.api, this.id, this.version);
	}

	// #endregion Public Methods (1)
}
