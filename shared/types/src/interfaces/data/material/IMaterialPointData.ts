import {type IMapData, type IMapDataPropertiesDefinition} from "./IMapData";
import {
	type IMaterialAbstractData,
	type IMaterialAbstractDataPropertiesGeneric} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialPointDataProperties = Partial<
	IMaterialPointDataPropertiesGeneric<IMapData>
>;
export type IMaterialPointDataPropertiesDefinition = Partial<
	IMaterialPointDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialPointData
	extends IMaterialPointDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	// #region Public Methods (2)

	clone(): IMaterialPointData;
	copy(source: IMaterialPointData): void;

	// #endregion Public Methods (2)
}

interface IMaterialPointDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (2)

	size?: number;
	sizeAttenuation?: boolean;

	// #endregion Properties (2)
}

// #endregion Interfaces (2)
