import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { ISDTFAttributeData, ISDTFAttributesData } from '../../interfaces/sdtf/ISDTFAttributesData';
import { SdtfTypeHintName } from '@shapediver/sdk.sdtf-v1'

export class SDTFAttributeData implements ISDTFAttributeData {
    // #region Properties (2)

    readonly #typeHint;
    readonly #value;

    #resolvedValue: any;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(
        typeHint: SdtfTypeHintName | string,
        value: any
    ) {
        this.#typeHint = typeHint;
        this.#value = value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get typeHint(): SdtfTypeHintName | string {
        return this.#typeHint;
    }

    public get value(): any {
        if(this.#value instanceof Function && !this.#resolvedValue) {
            this.#resolvedValue = this.#value();
            return this.#resolvedValue;
        } else if(this.#value instanceof Function) {
            return this.#resolvedValue;
        }

        return this.#value;
    }

    // #endregion Public Accessors (2)
}

// export class SDTFAttributeAsyncData {
//     // #region Properties (2)

//     readonly #typeHint;
//     readonly #accessor;
//     private _value: Promise<any> | undefined;
//     private readonly _loadAccessor: (accessorID: number) => Promise<any>

//     // #endregion Properties (2)

//     // #region Constructors (1)

//     constructor(
//             typeHint: string,
//             accessor: number,
//         private readonly _loadAccessor: (accessorID: number) => Promise<any>
//     ) {
//         this._typeHint = typeHint;
//         this._accessor = accessor;
//     }

//     public get value(): Promise<any> {
//         if (this.value !== undefined) {
//             return this._value!;
//         } else {
//             this._value = this._loadAccessor!(this._accessor!);
//             return this._value;
//         }
//     }

//     public get typeHint(): string {
//         return this._typeHint;
//     }

//     // #endregion Constructors (1)
// }

export class SDTFAttributesData extends AbstractTreeNodeData implements ISDTFAttributesData {
    // #region Properties (1)

    readonly #attributes: {
        [key: string]: SDTFAttributeData
    } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        attributes: {
            [key: string]: SDTFAttributeData
        } = {},
        id?: string
    ) {
        super(id);
        this.#attributes = attributes;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get attributes(): {
        [key: string]: SDTFAttributeData
    } {
        return this.#attributes;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ISDTFAttributesData {
        return new SDTFAttributesData(this.attributes, this.id);
    }

    // #endregion Public Methods (1)
}