import { IMaterialData, IMaterialDataProperties } from "./IMaterialData";

export interface IMaterialUnlitDataProperties extends IMaterialDataProperties {};

export interface IMaterialUnlitData extends IMaterialData {
    // #region Public Methods (2)

    clone(): IMaterialUnlitData;
    copy(source: IMaterialUnlitData): void;

    // #endregion Public Methods (2)
}