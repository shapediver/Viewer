import { IMapData } from "./IMapData";
import { IMaterialData, IMaterialDataProperties } from "./IMaterialData";

export interface IMaterialSpecularGlossinessDataProperties extends IMaterialDataProperties {
    // #region Properties (5)

    glossiness?: number,
    glossinessMap?: IMapData,
    specular?: string,
    specularGlossinessMap?: IMapData,
    specularMap?: IMapData,

    // #endregion Properties (5)
};

export interface IMaterialSpecularGlossinessData extends IMaterialData {
    // #region Public Methods (2)

    glossiness: number,
    glossinessMap?: IMapData,
    specular: string,
    specularGlossinessMap?: IMapData,
    specularMap?: IMapData,

    clone(): IMaterialSpecularGlossinessData;
    copy(source: IMaterialSpecularGlossinessData): void;

    // #endregion Public Methods (2)
}