import { IMaterialAbstractData, IMaterialAbstractDataProperties } from './IMaterialAbstractData';

// #region Type aliases (1)

export type IMaterialBasicLineDataProperties = IMaterialAbstractDataProperties;

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface IMaterialBasicLineData extends IMaterialAbstractData {
    // #region Public Methods (2)

    clone(): IMaterialBasicLineData;
    copy(source: IMaterialBasicLineData): void;

    // #endregion Public Methods (2)
}

// #endregion Interfaces (1)
