import { SettingsVersion } from "./SettingsVersion";
import { ISettings, ISettingsVersion, ISettingsDictionary, IViewerVersionSettingsVersion } from "./interfaces/interfaces";
import { Settings as Settings_1_0 } from "./versions/1.0/Settings";
import { Settings as Settings_2_0 } from "./versions/2.0/Settings";

class ViewerVersionSettingsVersion implements IViewerVersionSettingsVersion {
    // #region Properties (2)

    viewer_version: ISettingsVersion;    
    settings_version: ISettingsVersion;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(viewerVersion: string, settingsVersion: string) {
        this.viewer_version = new SettingsVersion(viewerVersion);
        this.settings_version = new SettingsVersion(settingsVersion);
    }

    // #endregion Constructors (1)
}

export class SettingsConversion {
    // #region Properties (2)

    private _settingsVersions: ISettings[] = [];
    private _versions: ISettingsDictionary<any> = {
        '1.0.0': Settings_1_0,
        '2.0.0': Settings_2_0
    }

    private _mapViewerVersionSettingsVersion: IViewerVersionSettingsVersion[] = [
        new ViewerVersionSettingsVersion('2.18.0', '2.0'), 
    ]

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        for(let k of Object.keys(this._versions))
            this._settingsVersions.push(new this._versions[k]());
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public convert(settingsJSON: any, version: string, persistentOnly: boolean = false): any {
        let settings: ISettings = this.createSettingsObject(settingsJSON);

        let currentVersion = settings.version,
            requiredVersion = new SettingsVersion(version);
        let indexCurrent = this._findVersionIndex(currentVersion);
        let indexRequired = this._findVersionIndex(requiredVersion);
    
        if(indexCurrent === -1 || indexRequired === -1) return settings.toJSON();

        let convertedSettings: ISettings = settings;
        if (indexCurrent < indexRequired) {
            while(indexCurrent < indexRequired) {
                indexCurrent+=1;
                let currentVersion = this._versions[this._settingsVersions[indexCurrent].version.toString()];
                convertedSettings = (new currentVersion()).convertFromPreviousVersion(convertedSettings);
            }
        } else if (indexCurrent > indexRequired) {
            while (indexCurrent > indexRequired) {
                indexCurrent-=1;
                convertedSettings = convertedSettings.convertToPreviousVersion();
            }
        }
        return convertedSettings.toJSON(persistentOnly);
    }

    public createSettingsObject(settingsJSON: any): ISettings {
        if(!settingsJSON.settings_version) return new Settings_1_0(settingsJSON);
    
        let version = new SettingsVersion(settingsJSON.settings_version);
        return new this._versions[version.toString()](settingsJSON);
    }

    public mapViewerVersionToSettingsVersion(versionString: string): string {
        let version = new SettingsVersion(versionString || '0.0.0');

        for (let kvp of this._mapViewerVersionSettingsVersion) {
            if ( kvp.viewer_version.isLowerThan(version) || kvp.viewer_version.equalTo(version) ) {
                return kvp.settings_version.toString();
            }
        }

        return '1.0';
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    private _findVersionIndex(version: ISettingsVersion): number {
        let v = new SettingsVersion(version.toString());
        for (let i = 0; i < this._settingsVersions.length; i++)
            if(this._settingsVersions[i].version.equalTo(v))
                return i;

        v.versionLevels[v.versionLevels.length-1] = 0;
        for (let i = 0; i < this._settingsVersions.length; i++)
            if(this._settingsVersions[i].version.equalTo(v))
                return i;
        
        return -1;
    }

    // #endregion Private Methods (1)
}