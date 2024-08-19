import { Color } from '../../../types';
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { vec2 } from 'gl-matrix';

// #region Type aliases (2)

export type IMapDataProperties = IMapDataPropertiesGeneric<HTMLImageElement | ArrayBuffer>;
export type IMapDataPropertiesDefinition = Partial<IMapDataPropertiesGeneric<HTMLImageElement | ArrayBuffer | string>>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMapData extends ITreeNodeData, IMapDataProperties {
    // #region Public Methods (1)

    clone(): IMapData;

    // #endregion Public Methods (1)
}

interface IMapDataPropertiesGeneric<T> {
    // #region Properties (15)

    asData?: boolean;
    blob?: Blob;
    center: vec2;
    color?: Color;
    data?: number[];
    flipY: boolean;
    image: T;
    magFilter: TEXTURE_FILTERING;
    minFilter: TEXTURE_FILTERING;
    offset: vec2;
    repeat: vec2;
    rotation: number;
    texCoord?: number;
    wrapS: TEXTURE_WRAPPING;
    wrapT: TEXTURE_WRAPPING;

    // #endregion Properties (15)
}

// #endregion Interfaces (2)

// #region Enums (2)

export enum TEXTURE_FILTERING {
    NONE = 0,
    NEAREST = 9728,
    LINEAR = 9729,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987,
}

export enum TEXTURE_WRAPPING {
    REPEAT = 10497,
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648
}

// #endregion Enums (2)
