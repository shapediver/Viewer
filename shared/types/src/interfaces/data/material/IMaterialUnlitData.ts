import { IMaterialAbstractData, IMaterialAbstractDataProperties } from "./IMaterialAbstractData";

export interface IMaterialUnlitDataProperties extends IMaterialAbstractDataProperties {};

export interface IMaterialUnlitData extends IMaterialAbstractData {
    // #region Public Methods (2)

    clone(): IMaterialUnlitData;
    copy(source: IMaterialUnlitData): void;

    // #endregion Public Methods (2)
}