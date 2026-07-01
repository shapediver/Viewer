import {SdtfTypeHintName} from "@shapediver/sdk.sdtf-v1";
import {
	type ISDTFAttributeData,
	type ISDTFItemData} from "@shapediver/viewer.shared.types";
import {AbstractTreeNodeData} from "../AbstractTreeNodeData";

export class SDTFItemData
	extends AbstractTreeNodeData
	implements ISDTFItemData
{
	// #region Properties (3)

	readonly #typeHint;
	readonly #value;

	#attributes: {
		[key: string]: ISDTFAttributeData;
	} = {};
	#resolvedValue: any;

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(
		typeHint: SdtfTypeHintName | string,
		value: any,
		attributes: {
			[key: string]: ISDTFAttributeData;
		},
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#attributes = attributes;
		this.#typeHint = typeHint;
		this.#value = value;
	}

	// #endregion Constructors (1)

	// #region Public Accessors (3)

	public get attributes(): {
		[key: string]: ISDTFAttributeData;
	} {
		return this.#attributes;
	}

	public get typeHint(): SdtfTypeHintName | string {
		return this.#typeHint;
	}

	public get value(): any {
		if (this.#value instanceof Function && !this.#resolvedValue) {
			this.#resolvedValue = this.#value();
			return this.#resolvedValue;
		} else if (this.#value instanceof Function) {
			return this.#resolvedValue;
		}
		return this.#value;
	}

	// #endregion Public Accessors (3)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): ISDTFItemData {
		return new SDTFItemData(
			this.typeHint,
			this.value,
			this.attributes,
			this.id,
			this.version,
		);
	}

	// #endregion Public Methods (1)
}
