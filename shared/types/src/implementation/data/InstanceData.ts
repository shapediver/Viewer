import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {mat4} from "gl-matrix";
import {IInstanceData} from "../../interfaces/data/IInstanceData";
import {Color} from "../../types";

export class InstanceData
	extends AbstractTreeNodeData
	implements IInstanceData
{
	// #region Properties (2)

	#instanceColors: Color[] = [];
	#instanceMatrices: mat4[] = [];

	// #endregion Properties (2)

	// #region Constructors (1)

	/**
	 * Creates a instanceMatrices data node.
	 *
	 * @param _data the data as key- value pairs
	 * @param id the id
	 */
	constructor(
		instanceMatrices: mat4[] = [],
		instanceColors: Color[] = [],
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#instanceMatrices = instanceMatrices;
		this.#instanceColors = instanceColors;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get instanceColors(): Color[] {
		return this.#instanceColors;
	}

	public set instanceColors(value: Color[]) {
		this.#instanceColors = value;
	}

	public get instanceMatrices(): mat4[] {
		return this.#instanceMatrices;
	}

	public set instanceMatrices(value: mat4[]) {
		this.#instanceMatrices = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): IInstanceData {
		return new InstanceData(
			this.instanceMatrices,
			this.instanceColors,
			this.id,
			this.version,
		);
	}

	// #endregion Public Methods (1)
}
