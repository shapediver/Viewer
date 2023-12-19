import { vec2 } from 'gl-matrix';
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from './IMaterialAbstractData';

export interface IMaterialLineDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (9)

    alphaToCoverage?: boolean;
    dashOffset?: number;
    dashScale?: number;
    dashSize?: number;
    dashed?: boolean;
    gapSize?: number;
    lineWidth?: number;
    resolution?: vec2;
    worldUnits?: boolean;

    // #endregion Properties (9)
}

export interface IMaterialLineData extends IMaterialAbstractData {
    // #region Properties (9)

    alphaToCoverage?: boolean;
    dashOffset?: number;
    dashScale?: number;
    dashSize?: number;
    dashed?: boolean;
    gapSize?: number;
    lineWidth?: number;
    resolution?: vec2;
    worldUnits?: boolean;

    // #endregion Properties (9)

    // #region Public Methods (2)

    clone(): IMaterialLineData;
    copy(source: IMaterialLineData): void;

    // #endregion Public Methods (2)
}