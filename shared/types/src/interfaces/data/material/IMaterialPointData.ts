import { IMaterialAbstractData, IMaterialAbstractDataProperties } from './IMaterialAbstractData';

export interface IMaterialPointDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (2)

    size?: number,
    sizeAttenuation?: boolean

    // #endregion Properties (2)
}

export interface IMaterialPointData extends IMaterialAbstractData {
    // #region Properties (2)

    size?: number,
    sizeAttenuation?: boolean

    // #endregion Properties (2)

    // #region Public Methods (2)

    clone(): IMaterialPointData;
    copy(source: IMaterialPointData): void;

    // #endregion Public Methods (2)
}