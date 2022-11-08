import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialUnlitDataProperties extends IMaterialAbstractDataProperties {
    // #region Properties (1)

    envMap?: string | string[];

    // #endregion Properties (1)
};

export interface IMaterialUnlitData extends IMaterialAbstractData {
    // #region Properties (1)

    envMap?: string | string[];

    // #endregion Properties (1)

    // #region Public Methods (2)

    clone(): IMaterialUnlitData;
    copy(source: IMaterialUnlitData): void;

    // #endregion Public Methods (2)
}