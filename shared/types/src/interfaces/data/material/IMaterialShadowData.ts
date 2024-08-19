import { IMaterialAbstractData, IMaterialAbstractDataProperties, IMaterialAbstractDataPropertiesDefinition } from './IMaterialAbstractData';

// #region Type aliases (2)

export type IMaterialShadowDataProperties = IMaterialAbstractDataProperties;
export type IMaterialShadowDataPropertiesDefinition = IMaterialAbstractDataPropertiesDefinition;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IMaterialShadowData extends IMaterialAbstractData {
    // #region Public Methods (2)

    clone(): IMaterialShadowData;
    copy(source: IMaterialShadowData): void;

    // #endregion Public Methods (2)
}

// #endregion Interfaces (1)
