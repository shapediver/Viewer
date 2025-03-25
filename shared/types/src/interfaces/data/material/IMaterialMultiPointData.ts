import {Color} from "../../../types";
import {IMapData, IMapDataPropertiesDefinition} from "./IMapData";
import {
	IMaterialAbstractData,
	IMaterialAbstractDataPropertiesGeneric,
} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialMultiPointDataProperties = Partial<
	IMaterialMultiPointDataPropertiesGeneric<IMapData>
>;
export type IMaterialMultiPointDataPropertiesDefinition = Partial<
	IMaterialMultiPointDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialMultiPointData
	extends IMaterialAbstractData,
		IMaterialMultiPointDataPropertiesGeneric<IMapData> {
	// #region Public Methods (2)

	clone(): IMaterialMultiPointData;
	copy(source: IMaterialMultiPointData): void;

	// #endregion Public Methods (2)
}

interface IMaterialMultiPointDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (42)

	alphaMap_0?: T;
	alphaMap_1?: T;
	alphaMap_2?: T;
	alphaMap_3?: T;
	alphaMap_4?: T;
	alphaMap_5?: T;
	alphaMap_6?: T;
	alphaMap_7?: T;
	color_0?: Color;
	color_1?: Color;
	color_2?: Color;
	color_3?: Color;
	color_4?: Color;
	color_5?: Color;
	color_6?: Color;
	color_7?: Color;
	map_0?: T;
	map_1?: T;
	map_2?: T;
	map_3?: T;
	map_4?: T;
	map_5?: T;
	map_6?: T;
	map_7?: T;
	materialIndexDataMap?: T;
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

	// #endregion Properties (42)
}

// #endregion Interfaces (2)
