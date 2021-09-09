import { ISettingsV3, DefaultsV3, ICameraSettingsV3, convert, validate } from '@shapediver/viewer.settings';
import { container, singleton } from 'tsyringe'

import { EventEngine } from '../event-engine/EventEngine'
import { EVENTTYPE } from '../event-engine/EventTypes'
import { StateEngine } from '../state-engine/StateEngine'

type IARSettings = ISettingsV3["ar"];
type ICameraSettings = ISettingsV3["camera"];
type IEnvironmentSettings = ISettingsV3["environment"];
type IEnvironmentGeometrySettings = ISettingsV3["environmentGeometry"];
type IGeneralSettings = ISettingsV3["general"];
type ILightSettings = ISettingsV3["light"];
type IRenderingSettings = ISettingsV3["rendering"];
type ISessionSettings = ISettingsV3["session"];

@singleton()
export class SettingsEngine {
    // #region Properties (1)

    private readonly _settings: ISettingsV3 = DefaultsV3();
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _sessionSettings = ['commitParameters', 'commitSettings', 'controlNames', 'controlOrder', 'parametersHidden'];
    private _version: '1.0' | '2.0' | '3.0' = '3.0';


    // #endregion Properties (1)

    // #region Public Accessors (8)

    public get settings(): ISettingsV3 {
        return this._settings;
    }

    public get ar(): IARSettings {
        return this._settings.ar;
    }

    public get camera(): ICameraSettings {
        return this._settings.camera;
    }

    public get environment(): IEnvironmentSettings {
        return this._settings.environment;
    }

    public get environmentGeometry(): IEnvironmentGeometrySettings {
        return this._settings.environmentGeometry;
    }

    public get general(): IGeneralSettings {
        return this._settings.general;
    }

    public get light(): ILightSettings {
        return this._settings.light;
    }

    public get rendering(): IRenderingSettings {
        return this._settings.rendering;
    }

    public get session(): ISessionSettings {
        return this._settings.session;
    }

    public set session(value: ISessionSettings) {
        this._settings.session = value;
    }

    public convertToTargetVersion(): any {
        return convert(this._settings, this._version);
    }

    public loadSettings(json: any, sessionId: string, loadAsPrimary: boolean = false) {
        try { validate(json, '3.0'); this._version = '3.0'; } catch (e) { }
        try { validate(json, '2.0'); this._version = '2.0'; } catch (e) { }
        try { validate(json, '1.0'); this._version = '1.0'; } catch (e) { }
        (<any>this._settings) = convert(json, '3.0');
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { sessionId });
    }

    public flatten() {
        const flattenObject = (ob: any) => {
            const toReturn: { [key: string]: any } = {};
            for (let i in ob) {
                if (!ob.hasOwnProperty(i)) continue;
                if ((typeof ob[i]) == 'object') {
                    const flatObject = flattenObject(ob[i]);
                    for (var x in flatObject) {
                        if (!flatObject.hasOwnProperty(x)) continue;
                        toReturn[i + '.' + x] = flatObject[x];
                    }
                } else {
                    toReturn[i] = ob[i];
                }
            }
            return toReturn;
        };
        return flattenObject(this.settings);
    }

    public reset() {
        (<any>this._settings) = DefaultsV3();
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { sessionId: '' });
    }

    // #endregion Public Accessors (8)
}