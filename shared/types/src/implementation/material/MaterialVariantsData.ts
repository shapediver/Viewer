import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IMaterialVariantsData } from '../../interfaces/data/material/IMaterialVariantsData';
import { PrimitiveData } from '../data/GeometryData';

export class MaterialVariantsData extends AbstractTreeNodeData implements IMaterialVariantsData {
    // #region Properties (1)

    readonly #variants: string[] = [];
    readonly #primitiveData: PrimitiveData[] = [];
    #variantIndex?: number;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(id?: string) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get primitiveData(): PrimitiveData[] {
        return this.#primitiveData;
    }

    public get variants(): string[] {
        return this.#variants;
    }

    public get variantIndex(): number | undefined {
        return this.#variantIndex;
    }

    public set variantIndex(value: number | undefined) {
        this.#variantIndex = value;
        for(let i = 0; i < this.primitiveData.length; i++) {            
            const variant = this.primitiveData[i].materialVariants.find(v => v.variant === this.#variantIndex);
            if(variant) {
                this.primitiveData[i].material = variant.material;
            } else {
                this.primitiveData[i].material = this.primitiveData[i].standardMaterial;
            }
        }
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): IMaterialVariantsData {
        return new MaterialVariantsData(this.id);
    }

    // #endregion Public Methods (1)
}
