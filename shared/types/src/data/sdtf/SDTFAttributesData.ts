import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export enum PRIMITIVE_TYPEHINT {
    DOUBLE = 'double',
    COLOR = 'color',
    STRING = 'string',
    BOOL = 'bool',
    FLOAT = 'float',
    DECIMAL = 'decimal',
    CULTUREINFO = 'cultureinfo',
    INT = 'int',
}

export enum GEOMETRY_TYPEHINT {
    COMPLEX = 'geometry.complex',
    INTERVAL2 = 'geometry.interval2',
    PATH = 'grasshopper.path',
    ARC = 'geometry.arc',
    BOUNDINGBOX = 'geometry.boundingbox',
    BOX = 'geometry.box',
    CIRCLE = 'geometry.circle',
    CONE = 'geometry.cone',
    CYLINDER = 'geometry.cylinder',
    ELLIPSE = 'geometry.ellipse',
    INTERVAL = 'geometry.interval',
    LINE = 'geometry.line',
    MATRIX = 'geometry.matrix',
    PLANE = 'geometry.plane',
    POINT2D = 'geometry.point2d',
    POINT2F = 'geometry.point2f',
    POINT3D = 'geometry.point3d',
    POINT3F = 'geometry.point3f',
    POINT4D = 'geometry.point4d',
    POLYLINE = 'geometry.polyline',
    RAY = 'geometry.ray',
    RECTANGLE = 'geometry.rectangle',
    SPHERE = 'geometry.sphere',
    TORUS = 'geometry.torus',
    TRANSFORM = 'geometry.transform',
    VECTOR2D = 'geometry.vector2d',
    VECTOR2F = 'geometry.vector2f',
    VECTOR3D = 'geometry.vector3d',
    VECTOR3F = 'geometry.vector3f',
}
  
  // https://shapediver.atlassian.net/browse/SS-2957
//   export enum RHINOTYPEHINT {
//     TEMP = 'temp'
//   }

export class SDTFAttributeData {
    // #region Properties (2)

    readonly #typeHint;
    readonly #value;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(
        typeHint: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string,
        value: any
    ) {
        this.#typeHint = typeHint;
        this.#value = value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get typeHint(): PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string {
        return this.#typeHint;
    }

    public get value(): any {
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

export class SDTFAttributesData extends AbstractTreeNodeData {
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
    public clone(): ITreeNodeData {
        return new SDTFAttributesData(this.attributes, this.id);
    }

    // #endregion Public Methods (1)
}