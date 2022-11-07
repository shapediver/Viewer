import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialSpecularGlossinessDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (6)

    envMap?: string | string[];
    glossiness?: number,
    glossinessMap?: IMapData,
    specular?: string,
    specularGlossinessMap?: IMapData,
    specularMap?: IMapData,

    // #endregion Properties (6)
};

export interface IMaterialSpecularGlossinessData extends IMaterialAbstractData {
    // #region Properties (6)

    envMap?: string | string[];
    glossiness: number,
    glossinessMap?: IMapData,
    specular: string,
    specularGlossinessMap?: IMapData,
    specularMap?: IMapData,

    // #endregion Properties (6)

    // #region Public Methods (2)

    clone(): IMaterialSpecularGlossinessData;
    copy(source: IMaterialSpecularGlossinessData): void;

    // #endregion Public Methods (2)
}