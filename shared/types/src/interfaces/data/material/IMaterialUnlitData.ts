import {IMapData, IMapDataPropertiesDefinition} from "./IMapData";
import {
	IMaterialAbstractData,
	IMaterialAbstractDataPropertiesGeneric,
} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialUnlitDataProperties = Partial<
	IMaterialUnlitDataPropertiesGeneric<IMapData>
>;
export type IMaterialUnlitDataPropertiesDefinition = Partial<
	IMaterialUnlitDataPropertiesGeneric<IMapDataPropertiesDefinition>
>;

// #endregion Type aliases (2)

// #region Interfaces (2)

export interface IMaterialUnlitData
	extends IMaterialUnlitDataPropertiesGeneric<IMapData>,
		IMaterialAbstractData {
	// #region Public Methods (2)

	clone(): IMaterialUnlitData;
	copy(source: IMaterialUnlitData): void;

	// #endregion Public Methods (2)
}

interface IMaterialUnlitDataPropertiesGeneric<T>
	extends IMaterialAbstractDataPropertiesGeneric<T> {
	// #region Properties (1)

	envMap?: string | string[];

	// #endregion Properties (1)
}

// #endregion Interfaces (2)
