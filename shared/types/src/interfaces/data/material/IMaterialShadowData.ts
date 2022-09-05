import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialShadowDataProperties extends IMaterialAbstractDataProperties {};

export interface IMaterialShadowData extends IMaterialAbstractData {
    // #region Public Methods (2)

    clone(): IMaterialShadowData;
    copy(source: IMaterialShadowData): void;

    // #endregion Public Methods (2)
}