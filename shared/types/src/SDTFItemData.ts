import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { SDTFAttributeData } from './SDTFAttributesData';

export class SDTFItemData extends AbstractTreeNodeData {
    // #region Properties (3)

    readonly #typeHint;
    readonly #value;

    #attributes: {
        [key: string]: SDTFAttributeData
    } = {};

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        typeHint: string,
        value: any,
        attributes: {
            [key: string]: SDTFAttributeData
        },
        id?: string
    ) {
        super(id);
        this.#attributes = attributes;
        this.#typeHint = typeHint;
        this.#value = value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get attributes(): {
        [key: string]: SDTFAttributeData
    } {
        return this.#attributes;
    }

    public get typeHint(): string {
        return this.#typeHint;
    }

    public get value(): any {
        return this.#value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new SDTFItemData(this.typeHint, this.value, this.attributes, this.id);
    }

    // #endregion Public Methods (1)
}