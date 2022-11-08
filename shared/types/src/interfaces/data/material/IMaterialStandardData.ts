import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialStandardDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (30)

    attenuationColor?: string,
    attenuationDistance?: number;
    clearcoat?: number;
    clearcoatMap?: IMapData;
    clearcoatNormalMap?: IMapData;
    clearcoatRoughness?: number;
    clearcoatRoughnessMap?: IMapData;
    displacementBias?: number;
    displacementMap?: IMapData;
    displacementScale?: number;
    envMap?: string | string[];
    ior?: number;
    metalness?: number,
    metalnessMap?: IMapData,
    metalnessRoughnessMap?: IMapData,
    roughness?: number,
    roughnessMap?: IMapData,
    sheen?: number,
    sheenColor?: string,
    sheenColorMap?: IMapData,
    sheenRoughness?: number,
    sheenRoughnessMap?: IMapData,
    specularColor?: string,
    specularColorMap?: IMapData,
    specularIntensity?: number,
    specularIntensityMap?: IMapData,
    thickness?: number;
    thicknessMap?: IMapData;
    transmission?: number;
    transmissionMap?: IMapData;

    // #endregion Properties (30)
};

export interface IMaterialStandardData extends IMaterialAbstractData {
    // #region Properties (30)

    attenuationColor: string,
    attenuationDistance: number;
    clearcoat: number;
    clearcoatMap?: IMapData;
    clearcoatNormalMap?: IMapData;
    clearcoatRoughness: number;
    clearcoatRoughnessMap?: IMapData;
    displacementBias: number;
    displacementMap?: IMapData;
    displacementScale: number;
    envMap?: string | string[];
    ior: number;
    metalness: number,
    metalnessMap?: IMapData,
    metalnessRoughnessMap?: IMapData,
    roughness: number,
    roughnessMap?: IMapData,
    sheen: number,
    sheenColor: string,
    sheenColorMap?: IMapData,
    sheenRoughness: number,
    sheenRoughnessMap?: IMapData,
    specularColor: string,
    specularColorMap?: IMapData,
    specularIntensity: number,
    specularIntensityMap?: IMapData,
    thickness: number;
    thicknessMap?: IMapData;
    transmission: number;
    transmissionMap?: IMapData;

    // #endregion Properties (30)

    // #region Public Methods (2)

    clone(): IMaterialStandardData;
    copy(source: IMaterialStandardData): void;

    // #endregion Public Methods (2)
}