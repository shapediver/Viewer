import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IMapData } from "./IMapData";

export enum MATERIAL_SIDE {
    DOUBLE = 'double',
    FRONT = 'front',
    BACK = 'back'
}

export enum MATERIAL_ALPHA {
    OPAQUE = 'opaque',
    MASK = 'mask',
    BLEND = 'blend'
}

export enum MATERIAL_SHADING {
    FLAT = 'flat',
    SMOOTH = 'smooth'
}

export interface IMaterialAbstractDataProperties {
    // #region Properties (17)

    alphaCutoff?: number,
    alphaMap?: IMapData,
    alphaMode?: MATERIAL_ALPHA,
    aoMap?: IMapData,
    aoMapIntensity?: number,
    bumpMap?: IMapData,
    bumpScale?: number,
    color?: string,
    emissiveMap?: IMapData,
    emissiveness?: string,
    map?: IMapData,
    name?: string,
    normalMap?: IMapData,
    normalScale?: number,
    opacity?: number,
    shading?: MATERIAL_SHADING,
    side?: MATERIAL_SIDE

    // #endregion Properties (17)
}

export interface IMaterialAbstractData extends ITreeNodeData {
    // #region Properties (18)

    alphaCutoff: number,
    alphaMap?: IMapData,
    alphaMode: MATERIAL_ALPHA,
    aoMap?: IMapData,
    aoMapIntensity: number,
    bumpMap?: IMapData,
    bumpScale: number,
    color: string,
    emissiveMap?: IMapData,
    emissiveness: string,
    map?: IMapData,
    materialOutput: boolean;
    name?: string,
    normalMap?: IMapData,
    normalScale: number,
    opacity: number,
    shading: MATERIAL_SHADING,
    side: MATERIAL_SIDE,
    threeJsObject: { [key: string]: THREE.Material };

    // #endregion Properties (18)

    // #region Public Methods (3)

    clone(): IMaterialAbstractData;
    copy(source: IMaterialAbstractData): void
    reset(): void

    // #endregion Public Methods (3)
}