import { mat3, mat4, vec3 } from "gl-matrix";
import { IMapData } from "./IMapData";
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialGemDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (5)

    refractionIndex?: number;
    impurityMap?: IMapData;
    impurityScale?: number;
    colorTransferBegin?: string;
    colorTransferEnd?: string;
    center?: vec3;
    radius?: number;
    sphericalNormalMap?: IMapData;
    gamma?: number;
    contrast?: number;
    brightness?: number;
    dispersion?: number;
    tracingDepth?: number;
    tracingOpacity?: number;
    inverseModelMatrix?: mat4;
    inverseTransposeModelMatrix?: mat3;

    // #endregion Properties (5)
};

export interface IMaterialGemData extends IMaterialAbstractData {
    // #region Public Methods (2)

    refractionIndex?: number;
    impurityMap?: IMapData;
    impurityScale?: number;
    colorTransferBegin?: string;
    colorTransferEnd?: string;
    center?: vec3;
    radius?: number;
    sphericalNormalMap?: IMapData;
    gamma?: number;
    contrast?: number;
    brightness?: number;
    dispersion?: number;
    tracingDepth?: number;
    tracingOpacity?: number;
    inverseModelMatrix?: mat4;
    inverseTransposeModelMatrix?: mat3;

    clone(): IMaterialGemData;
    copy(source: IMaterialGemData): void;

    // #endregion Public Methods (2)
}