import { ISettingsV3, DefaultsV3, convert, validate } from '@shapediver/viewer.settings';
import { container, singleton } from 'tsyringe'

import { EventEngine } from '../event-engine/EventEngine'
import { EVENTTYPE } from '../event-engine/EventTypes'
import { Logger, LOGGINGTOPIC } from '../logger/Logger';
import { SDError } from '../logger/SDError';

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
    // #region Properties (8)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _settings: ISettingsV3 = DefaultsV3();

    private _settings_version?: '1.0' | '2.0' | '3.0';

    // #endregion Properties (8)

    // #region Public Accessors (10)

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

    public get settings(): ISettingsV3 {
        return this._settings;
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (4)

    public convertToTargetVersion(): any {
        return convert(this._settings, this._settings_version || '3.0');
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

    public loadSettings(json: any, sessionId: string, loadAsPrimary: boolean = false) {
        if (JSON.stringify(json) !== JSON.stringify({})) {
            try { 
                validate(json, '1.0'); 
                this._settings_version = '1.0'; 
            
                (<any>this._settings) = convert(json, '3.0');
                this.cleanSettings(this._settings);

                return;
            } catch (e) {}
            
            try { 
                validate(json, '2.0'); 
                this._settings_version = '2.0'; 
            
                (<any>this._settings) = convert(json, '3.0');
                this.cleanSettings(this._settings);

                return;
            } catch (e) {}

            try { 
                validate(json, '3.0'); 
                this._settings_version = '3.0'; 
            
                (<any>this._settings) = convert(json, '3.0');
                this.cleanSettings(this._settings);

                return;
            } catch (e) {
                this._logger.error(LOGGINGTOPIC.SETTINGS, new SDError(e.message, e), 'Settings could not be validated.', false, true);
            }
        } else {
            this._settings_version = '3.0';
            (<any>this._settings) = DefaultsV3();
            return;
        }
    }

    public reset() {
        this._settings_version = undefined;
        (<any>this._settings) = DefaultsV3();
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private cleanSettings(json: ISettingsV3) {
        for(let c in json.camera.cameras) {
            const camera = json.camera.cameras[c];
            if(camera.type === 'perspective') {
                const restrictions = (<any>camera.controls).restrictions;
                if(restrictions.position.cube.min.x === null) restrictions.position.cube.min.x = -Infinity;
                if(restrictions.position.cube.min.y === null) restrictions.position.cube.min.y = -Infinity;
                if(restrictions.position.cube.min.z === null) restrictions.position.cube.min.z = -Infinity;
                if(restrictions.position.cube.max.x === null) restrictions.position.cube.max.x = Infinity;
                if(restrictions.position.cube.max.y === null) restrictions.position.cube.max.y = Infinity;
                if(restrictions.position.cube.max.z === null) restrictions.position.cube.max.z = Infinity;
                if(restrictions.position.sphere.radius === null) restrictions.position.sphere.radius = Infinity;
                if(restrictions.target.cube.min.x === null) restrictions.target.cube.min.x = -Infinity;
                if(restrictions.target.cube.min.y === null) restrictions.target.cube.min.y = -Infinity;
                if(restrictions.target.cube.min.z === null) restrictions.target.cube.min.z = -Infinity;
                if(restrictions.target.cube.max.x === null) restrictions.target.cube.max.x = Infinity;
                if(restrictions.target.cube.max.y === null) restrictions.target.cube.max.y = Infinity;
                if(restrictions.target.cube.max.z === null) restrictions.target.cube.max.z = Infinity;
                if(restrictions.target.sphere.radius === null) restrictions.target.sphere.radius = Infinity;
                if(restrictions.rotation.minAzimuthAngle === null) restrictions.rotation.minAzimuthAngle = -Infinity;
                if(restrictions.rotation.maxAzimuthAngle === null) restrictions.rotation.maxAzimuthAngle = Infinity;
                if(restrictions.zoom.maxDistance === null) restrictions.zoom.maxDistance = Infinity;
            }
        }
    }

    // #endregion Private Methods (1)
}