import {
	AbstractTreeNodeData,
	type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {UuidGenerator} from "@shapediver/viewer.shared.services";
import {type Color} from "@shapediver/viewer.shared.types";
import {type ILight, LIGHT_TYPE} from "../interface/ILight";

export abstract class AbstractLight
	extends AbstractTreeNodeData
	implements ILight
{
	// #region Properties (8)

	readonly #type: LIGHT_TYPE;

	#color: Color;
	#intensity: number;
	#name?: string;
	#order?: number;
	#parentNode?: ITreeNode;
	#useNodeData: boolean = false;

	protected readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

	// #endregion Properties (8)

	// #region Constructors (1)

	constructor(properties: {
		color: Color;
		intensity: number;
		type: LIGHT_TYPE;
		name?: string;
		order?: number;
		id?: string;
		version?: string;
	}) {
		super(properties.id, properties.version);
		this.#color = properties.color;
		this.#intensity = properties.intensity;
		this.#type = properties.type;
		this.#name = properties.name;
		this.#order = properties.order;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (13)

	public get color(): Color {
		return this.#color;
	}

	public set color(value: Color) {
		this.#color = value;
		this.updateVersion();
		if (this.parentNode) this.parentNode.updateVersion();
	}

	public get intensity(): number {
		return this.#intensity;
	}

	public set intensity(value: number) {
		this.#intensity = value;
		this.updateVersion();
		if (this.parentNode) this.parentNode.updateVersion();
	}

	public get name(): string | undefined {
		return this.#name;
	}

	public set name(value: string | undefined) {
		this.#name = value;
		this.updateVersion();
		if (this.parentNode) this.parentNode.updateVersion();
	}

	public get order(): number | undefined {
		return this.#order;
	}

	public set order(value: number | undefined) {
		this.#order = value;
		this.updateVersion();
		if (this.parentNode) this.parentNode.updateVersion();
	}

	public get parentNode(): ITreeNode | undefined {
		return this.#parentNode;
	}

	public set parentNode(value: ITreeNode | undefined) {
		this.#parentNode = value;
	}

	public get type(): LIGHT_TYPE {
		return this.#type;
	}

	public get useNodeData(): boolean {
		return this.#useNodeData;
	}

	public set useNodeData(value: boolean) {
		this.#useNodeData = value;
	}

	// #endregion Public Getters And Setters (13)
}
