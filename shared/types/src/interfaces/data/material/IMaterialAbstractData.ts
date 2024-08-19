import { Color } from '../../../types';
import { IMapData, IMapDataPropertiesDefinition } from './IMapData';
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

// #region Type aliases (2)

export type IMaterialAbstractDataProperties = Partial<IMaterialAbstractDataPropertiesGeneric<IMapData>>;
export type IMaterialAbstractDataPropertiesDefinition = Partial<IMaterialAbstractDataPropertiesGeneric<IMapDataPropertiesDefinition>>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialAbstractData extends ITreeNodeData, IMaterialAbstractDataPropertiesGeneric<IMapData> {
    // #region Properties (1)

    materialOutput: boolean;

    // #endregion Properties (1)

    // #region Public Methods (3)

    clone(): IMaterialAbstractData;
    copy(source: IMaterialAbstractData): void
    reset(): void

    // #endregion Public Methods (3)
}

export interface IMaterialAbstractDataPropertiesGeneric<T> {
    // #region Properties (21)

    alphaCutoff: number,
    alphaMap?: T,
    alphaMode: MATERIAL_ALPHA,
    aoMap?: T,
    aoMapIntensity: number,
    bumpMap?: T,
    bumpScale: number,
    color: Color,
    depthTest?: boolean,
    depthWrite?: boolean,
    emissiveMap?: T,
    emissiveness: Color,
    map?: T,
    name?: string,
    normalMap?: T,
    normalScale: number,
    opacity: number,
    shading: MATERIAL_SHADING,
    side: MATERIAL_SIDE,
    transparent?: boolean,
    type?: MATERIAL_TYPE

    // #endregion Properties (21)
}

// #endregion Interfaces (2)

// #region Enums (4)

export enum MATERIAL_ALPHA {
    OPAQUE = 'opaque',
    MASK = 'mask',
    BLEND = 'blend'
}

export enum MATERIAL_SHADING {
    FLAT = 'flat',
    SMOOTH = 'smooth'
}

export enum MATERIAL_SIDE {
    DOUBLE = 'double',
    FRONT = 'front',
    BACK = 'back'
}

export enum MATERIAL_TYPE {
    STANDARD = 'Standard',
    SPECULAR_GLOSSINESS = 'SpecularGlossiness',
    UNLIT = 'Unlit',
    GEM = 'Gem'
}

// #endregion Enums (4)
