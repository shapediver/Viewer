import { BaseSettings } from "../BaseSettings";

export interface ISettingsDictionary<T extends BaseSettings> {
  // #region Indexes (1)

  [key: string]: T

  // #endregion Indexes (1)
}

export interface ISettingsVersion {
  // #region Properties (1)

  versionLevels: number[];

  // #endregion Properties (1)

  // #region Methods (3)

  equalTo(v: ISettingsVersion): boolean;
  isLowerThan(v: ISettingsVersion): boolean;
  toString(): string;

  // #endregion Methods (3)
}

export interface ISettings {
  // #region Properties (2)

  settings: IBaseSettingsObject;
  version: ISettingsVersion;

  // #endregion Properties (2)

  // #region Methods (6)

  convertFromPreviousVersion(obj: ISettings): ISettings;
  convertToPreviousVersion(): ISettings;
  getSettingDefinitions(): any;
  getSettingObject(key: string): ISetting<any> | null;
  getSettings(persistentOnly?: boolean): any;
  toJSON(persistentOnly?: boolean): any;

  // #endregion Methods (6)
}

export interface ISetting<T> {
  // #region Properties (4)

  desc?: string,
  persistent: boolean
  type: string|Function,
  value: T,

  // #endregion Properties (4)
}

export interface IBaseSettingsObject {
  // #region Indexes (1)

  [key: string]: ISetting<any>|IBaseSettingsObject

  // #endregion Indexes (1)
}

export interface IGlobalSettingsObject {
  // #region Properties (3)

  build_date: ISetting<string>;
  build_version: ISetting<string>;
  settings_version: ISetting<string>;

  // #endregion Properties (3)

  // #region Indexes (1)

  [key: string]: ISetting<any>|IBaseSettingsObject

  // #endregion Indexes (1)
}

export interface IViewerVersionSettingsVersion {
  // #region Properties (3)

  viewer_version: ISettingsVersion;
  settings_version: ISettingsVersion;

  // #endregion Properties (3)
}