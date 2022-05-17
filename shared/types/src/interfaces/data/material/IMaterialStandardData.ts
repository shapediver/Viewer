import { IMapData } from "./IMapData";
import { IMaterialData, IMaterialDataProperties } from "./IMaterialData";

export interface IMaterialStandardDataProperties extends IMaterialDataProperties {
    // #region Properties (29)

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

    // #endregion Properties (29)
};

export interface IMaterialStandardData extends IMaterialData {
    // #region Public Methods (2)

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

    clone(): IMaterialStandardData;
    copy(source: IMaterialStandardData): void;

    // #endregion Public Methods (2)
}