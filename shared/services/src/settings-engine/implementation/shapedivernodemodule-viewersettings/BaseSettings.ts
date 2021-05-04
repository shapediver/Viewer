import { ISettings, IBaseSettingsObject, ISettingsVersion, ISetting } from "./interfaces/interfaces";
import { Setting } from "./Setting";

export abstract class BaseSettings implements ISettings {
    // #region Properties (2)

    protected _settings!: IBaseSettingsObject;
    protected _version!: ISettingsVersion;

    // #endregion Properties (2)

    // #region Public Accessors (3)

    public get settings(): IBaseSettingsObject {
        return this._settings;
    }

    public set settings(settings: IBaseSettingsObject) {
        this._settings = settings;
    }

    public get version(): ISettingsVersion {
        return this._version;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (4)

    public getSettingDefinitions() {
        let obj = {};
        this._getSettingDefinitions(this._settings, obj, '');
        return obj;
    }

    public getSettingObject(key: string): ISetting<any> | null {
        let levels = key.split('.');
        let obj: any = this._settings;
        for(let i = 0; i < levels.length; i++) {
            obj = obj[levels[i]];
            if(obj instanceof Setting && i < levels.length - 1) {
                obj = obj.value;
            } else if(obj instanceof Setting){
                return obj;
            } else if(!obj) {
                return null;
            }
        }
        return null;
    }

    public getSettings(persistentOnly: boolean = false) {
        let obj = {};
        this._getSettings(this._settings, persistentOnly, obj, '');
        return obj;
    }

    public toJSON(persistentOnly: boolean = false) {
        return this._toJSON(this._settings, persistentOnly);
    }

    // #endregion Public Methods (4)

    // #region Public Abstract Methods (2)

    public abstract convertFromPreviousVersion(obj: ISettings): ISettings;
    public abstract convertToPreviousVersion(): ISettings;

    // #endregion Public Abstract Methods (2)

    // #region Protected Methods (2)

    protected _fromJSON(settingsJSON: any, iterable: IBaseSettingsObject) {
        if(!settingsJSON) return;
        for (let s in iterable) {
            if (iterable[s] instanceof Setting) {
                let setting: ISetting<any> = (iterable[s] as ISetting<any>);
                let settingChildren = typeof setting.value === 'object' && setting.value !== null ? Object.values(setting.value) : [];
                if (settingChildren.length !== 0 && settingChildren[0] instanceof Setting) {
                    this._fromJSON(settingsJSON[s], iterable[s].value);
                } else {
                    if(settingsJSON[s] !== undefined) iterable[s].value = settingsJSON[s];
                }
            } else {
                this._fromJSON(settingsJSON[s], (iterable[s] as IBaseSettingsObject))
            }
        }
    }

    protected _toJSON(iterable: IBaseSettingsObject, persistentOnly: boolean) {
        let objJSON: {
            [key: string]: any
        } = {};
        for (let s in iterable) {
            if(iterable[s] instanceof Setting) {
                let setting: ISetting<any> = (iterable[s] as ISetting<any>);
                if(!persistentOnly || setting.persistent) {
                    let settingChildren = typeof setting.value === 'object' && setting.value !== null ? Object.values(setting.value) : [];
                    if(settingChildren.length !== 0 && settingChildren[0] instanceof Setting) {
                        objJSON[s] = this._toJSON(iterable[s].value, persistentOnly);
                    } else {
                        objJSON[s] = iterable[s].value;
                    }
                }
            } else if(iterable[s] instanceof String || typeof iterable[s] === 'string'){
                objJSON[s] = iterable[s];
            } else {
                objJSON[s] = this._toJSON((iterable[s] as IBaseSettingsObject), persistentOnly);
            }
        }
        return objJSON;
    }

    // #endregion Protected Methods (2)

    // #region Private Methods (2)

    private _getSettingDefinitions(iterable: IBaseSettingsObject, obj: any, path?: string) {
        let parentPath = path ? path + '.' : ''; 

        for (let s in iterable) {
            if(iterable[s] instanceof Setting) {
                let setting: ISetting<any> = (iterable[s] as ISetting<any>);
                let settingChildren = typeof setting.value === 'object' && setting.value !== null ? Object.values(setting.value) : [];
                if (settingChildren.length !== 0 && settingChildren[0] instanceof Setting) {
                    if (iterable[s].desc) {
                        obj[parentPath + s] = {};
                        obj[parentPath + s].descripton = iterable[s].desc;
                        if(typeof iterable[s].type === 'string' || iterable[s].type instanceof String)
                            obj[parentPath + s].type = iterable[s].type
                    }
                    this._getSettingDefinitions(iterable[s].value, obj, parentPath + s);
                } else {
                    if (iterable[s].desc) {
                        obj[parentPath + s] = {};
                        obj[parentPath + s].descripton = iterable[s].desc;
                        if(typeof iterable[s].type === 'string' || iterable[s].type instanceof String)
                            obj[parentPath + s].type = iterable[s].type
                    }
                }
            } else if(!(iterable[s] instanceof String || typeof iterable[s] === 'string')) {
                this._getSettingDefinitions((iterable[s] as IBaseSettingsObject), obj, parentPath+s);
            }
        }
    }

    private _getSettings(iterable: IBaseSettingsObject, persistentOnly: boolean, obj: any, path?: string) {
        let parentPath = path ? path + '.' : ''; 

        for (let s in iterable) {
            if(iterable[s] instanceof Setting) {
                let setting: ISetting<any> = (iterable[s] as ISetting<any>);
                if(!persistentOnly || setting.persistent) {
                    let settingChildren = typeof setting.value === 'object' && setting.value !== null ? Object.values(setting.value) : [];
                    if(settingChildren.length !== 0 && settingChildren[0] instanceof Setting) {
                        this._getSettings(iterable[s].value, persistentOnly, obj, parentPath+s);
                    } else {
                        obj[parentPath+s] = iterable[s].value;
                    }
                }
            } else if(iterable[s] instanceof String || typeof iterable[s] === 'string'){
                obj[parentPath+s] = iterable[s];
            } else {
                this._getSettings((iterable[s] as IBaseSettingsObject), persistentOnly, obj, parentPath+s);
            }
        }
    }

    // #endregion Private Methods (2)
}