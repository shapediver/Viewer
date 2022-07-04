import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialSpecularGlossinessDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (5)

    glossiness?: number,
    glossinessMap?: IMapData,
    specular?: string,
    specularGlossinessMap?: IMapData,
    specularMap?: IMapData,

    // #endregion Properties (5)
};

export interface IMaterialSpecularGlossinessData extends IMaterialAbstractData {
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