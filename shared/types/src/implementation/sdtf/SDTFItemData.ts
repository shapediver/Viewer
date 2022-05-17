import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { GEOMETRY_TYPEHINT, ISDTFAttributeData, PRIMITIVE_TYPEHINT } from '../../interfaces/sdtf/ISDTFAttributesData';
import { ISDTFItemData } from '../../interfaces/sdtf/ISDTFItemData';

export class SDTFItemData extends AbstractTreeNodeData implements ISDTFItemData {
    // #region Properties (3)

    readonly #typeHint;
    readonly #value;

    #attributes: {
        [key: string]: ISDTFAttributeData
    } = {};

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        typeHint: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string,
        value: any,
        attributes: {
            [key: string]: ISDTFAttributeData
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
        [key: string]: ISDTFAttributeData
    } {
        return this.#attributes;
    }

    public get typeHint(): PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string {
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
    public clone(): ISDTFItemData {
        return new SDTFItemData(this.typeHint, this.value, this.attributes, this.id);
    }

    // #endregion Public Methods (1)
}