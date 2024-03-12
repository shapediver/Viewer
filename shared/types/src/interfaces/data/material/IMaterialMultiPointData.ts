import { Color } from '../../../types';
import { IMapData } from './IMapData';
import { IMaterialAbstractData, IMaterialAbstractDataProperties } from './IMaterialAbstractData';

// #region Interfaces (2)

export interface IMaterialMultiPointData extends IMaterialAbstractData {
    // #region Properties (20)

    alphaMap_0?: IMapData;
    alphaMap_1?: IMapData;
    alphaMap_2?: IMapData;
    alphaMap_3?: IMapData;
    alphaMap_4?: IMapData;
    alphaMap_5?: IMapData;
    alphaMap_6?: IMapData;
    alphaMap_7?: IMapData;
    color_0?: Color;
    color_1?: Color;
    color_2?: Color;
    color_3?: Color;
    color_4?: Color;
    color_5?: Color;
    color_6?: Color;
    color_7?: Color;
    map_0?: IMapData;
    map_1?: IMapData;
    map_2?: IMapData;
    map_3?: IMapData;
    map_4?: IMapData;
    map_5?: IMapData;
    map_6?: IMapData;
    map_7?: IMapData;
    materialIndexDataMap?: IMapData;
    materialIndexDataMapSize?: number;
    sizeAttenuation_0?: boolean;
    sizeAttenuation_1?: boolean;
    sizeAttenuation_2?: boolean;
    sizeAttenuation_3?: boolean;
    sizeAttenuation_4?: boolean;
    sizeAttenuation_5?: boolean;
    sizeAttenuation_6?: boolean;
    sizeAttenuation_7?: boolean;
    size_0?: number;
    size_1?: number;
    size_2?: number;
    size_3?: number;
    size_4?: number;
    size_5?: number;
    size_6?: number;
    size_7?: number;

    // #endregion Properties (20)

    // #region Public Methods (2)

    clone(): IMaterialMultiPointData;
    copy(source: IMaterialMultiPointData): void;

    // #endregion Public Methods (2)
}

export interface IMaterialMultiPointDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (20)

    alphaMap_0?: IMapData;
    alphaMap_1?: IMapData;
    alphaMap_2?: IMapData;
    alphaMap_3?: IMapData;
    alphaMap_4?: IMapData;
    alphaMap_5?: IMapData;
    alphaMap_6?: IMapData;
    alphaMap_7?: IMapData;
    color_0?: Color;
    color_1?: Color;
    color_2?: Color;
    color_3?: Color;
    color_4?: Color;
    color_5?: Color;
    color_6?: Color;
    color_7?: Color;
    map_0?: IMapData;
    map_1?: IMapData;
    map_2?: IMapData;
    map_3?: IMapData;
    map_4?: IMapData;
    map_5?: IMapData;
    map_6?: IMapData;
    map_7?: IMapData;
    materialIndexDataMap?: IMapData;
    materialIndexDataMapSize?: number;
    sizeAttenuation_0?: boolean;
    sizeAttenuation_1?: boolean;
    sizeAttenuation_2?: boolean;
    sizeAttenuation_3?: boolean;
    sizeAttenuation_4?: boolean;
    sizeAttenuation_5?: boolean;
    sizeAttenuation_6?: boolean;
    sizeAttenuation_7?: boolean;
    size_0?: number;
    size_1?: number;
    size_2?: number;
    size_3?: number;
    size_4?: number;
    size_5?: number;
    size_6?: number;
    size_7?: number;

    // #endregion Properties (20)
}

// #endregion Interfaces (2)
