import {
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	IMaterialAbstractDataPropertiesDefinition,
} from "./IMaterialAbstractData";

// #region Type aliases (2)

export type IMaterialBasicLineDataProperties = IMaterialAbstractDataProperties;
export type IMaterialBasicLineDataPropertiesDefinition =
	IMaterialAbstractDataPropertiesDefinition;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IMaterialBasicLineData extends IMaterialAbstractData {
	// #region Public Methods (2)

	clone(): IMaterialBasicLineData;
	copy(source: IMaterialBasicLineData): void;

	// #endregion Public Methods (2)
}

// #endregion Interfaces (1)
