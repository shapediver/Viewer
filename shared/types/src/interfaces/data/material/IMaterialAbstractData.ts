import { Color } from '../../../types';
import { IMapData } from './IMapData';
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';

// #region Interfaces (2)

export interface IMaterialAbstractData extends ITreeNodeData {
    // #region Properties (21)

    alphaCutoff: number,
    alphaMap?: IMapData,
    alphaMode: MATERIAL_ALPHA,
    aoMap?: IMapData,
    aoMapIntensity: number,
    bumpMap?: IMapData,
    bumpScale: number,
    color: Color,
    depthTest?: boolean,
    depthWrite?: boolean,
    emissiveMap?: IMapData,
    emissiveness: Color,
    map?: IMapData,
    materialOutput: boolean;
    name?: string,
    normalMap?: IMapData,
    normalScale: number,
    opacity: number,
    shading: MATERIAL_SHADING,
    side: MATERIAL_SIDE,
    transparent?: boolean,

    // #endregion Properties (21)

    // #region Public Methods (3)

    clone(): IMaterialAbstractData;
    copy(source: IMaterialAbstractData): void
    reset(): void

    // #endregion Public Methods (3)
}

export interface IMaterialAbstractDataProperties {
    // #region Properties (21)

    alphaCutoff?: number,
    alphaMap?: IMapData,
    alphaMode?: MATERIAL_ALPHA,
    aoMap?: IMapData,
    aoMapIntensity?: number,
    bumpMap?: IMapData,
    bumpScale?: number,
    color?: Color,
    depthTest?: boolean,
    depthWrite?: boolean,
    emissiveMap?: IMapData,
    emissiveness?: Color,
    map?: IMapData,
    name?: string,
    normalMap?: IMapData,
    normalScale?: number,
    opacity?: number,
    shading?: MATERIAL_SHADING,
    side?: MATERIAL_SIDE,
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
