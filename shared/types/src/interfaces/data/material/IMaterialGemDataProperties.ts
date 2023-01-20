import { mat3, mat4, vec3 } from "gl-matrix";
import { Color } from "../../../types";
import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialGemDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (17)

    brightness?: number;
    center?: vec3;
    colorTransferBegin?: Color;
    colorTransferEnd?: Color;
    contrast?: number;
    dispersion?: number;
    envMap?: string | string[];
    gamma?: number;
    impurityMap?: IMapData;
    impurityScale?: number;
    radius?: number;
    refractionIndex?: number;
    sphericalNormalMap?: IMapData;
    tracingDepth?: number;
    tracingOpacity?: number;

    // #endregion Properties (17)
};

export interface IMaterialGemData extends IMaterialAbstractData {
    // #region Properties (17)

    brightness?: number;
    center?: vec3;
    colorTransferBegin?: Color;
    colorTransferEnd?: Color;
    contrast?: number;
    dispersion?: number;
    envMap?: string | string[];
    gamma?: number;
    impurityMap?: IMapData;
    impurityScale?: number;
    radius?: number;
    refractionIndex?: number;
    sphericalNormalMap?: IMapData;
    tracingDepth?: number;
    tracingOpacity?: number;

    // #endregion Properties (17)

    // #region Public Methods (2)

    clone(): IMaterialGemData;
    copy(source: IMaterialGemData): void;

    // #endregion Public Methods (2)
}