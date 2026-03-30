import {IMaterialVariantsData} from "@shapediver/viewer.shared.types";
import {AbstractTreeNodeData} from "../AbstractTreeNodeData";
import {GeometryData} from "../data/GeometryData";

export class MaterialVariantsData
	extends AbstractTreeNodeData
	implements IMaterialVariantsData
{
	// #region Properties (1)

	readonly #variants: string[] = [];
	readonly #geometryData: GeometryData[] = [];
	#variantIndex?: number;

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(id?: string, version?: string) {
		super(id, version);
	}

	// #endregion Constructors (1)

	// #region Public Accessors (2)

	public get geometryData(): GeometryData[] {
		return this.#geometryData;
	}

	public get variants(): string[] {
		return this.#variants;
	}

	public get variantIndex(): number | undefined {
		return this.#variantIndex;
	}

	public set variantIndex(value: number | undefined) {
		this.#variantIndex = value;
		for (let i = 0; i < this.geometryData.length; i++) {
			const variant = this.geometryData[i].materialVariants.find(
				(v) => v.variant === this.#variantIndex,
			);
			if (variant) {
				this.geometryData[i].material = variant.material;
			} else {
				this.geometryData[i].material =
					this.geometryData[i].standardMaterial;
			}
		}
	}

	// #endregion Public Accessors (2)

	// #region Public Methods (1)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): IMaterialVariantsData {
		return new MaterialVariantsData(this.id, this.version);
	}

	// #endregion Public Methods (1)
}
