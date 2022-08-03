import { convert, validate, DefaultsV3_1, ISettingsV3_1 } from '@shapediver/viewer.settings';
import { container, singleton } from 'tsyringe'

import { EventEngine } from '../event-engine/EventEngine'
import { Logger, LOGGING_TOPIC } from '../logger/Logger';
import { ShapeDiverViewerSettingsError } from '../logger/ShapeDiverViewerErrors';

type IARSettings = ISettingsV3_1["ar"];
type ICameraSettings = ISettingsV3_1["camera"];
type IEnvironmentSettings = ISettingsV3_1["environment"];
type IEnvironmentGeometrySettings = ISettingsV3_1["environmentGeometry"];
type IGeneralSettings = ISettingsV3_1["general"];
type ILightSettings = ISettingsV3_1["light"];
type IRenderingSettings = ISettingsV3_1["rendering"];
type ISessionSettings = ISettingsV3_1["session"];

export class SettingsEngine {
    // #region Properties (8)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _settings: ISettingsV3_1 = DefaultsV3_1();
    private _settings_version: '1.0' | '2.0' | '3.0' | '3.1' = '3.1';

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

    public get settings(): ISettingsV3_1 {
        return this._settings;
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (4)

    public convertToTargetVersion(): any {
        return convert(this._settings, this._settings_version);
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

    public loadSettings(json: any) {
        if (JSON.stringify(json) !== JSON.stringify({})) {
            try { 
                validate(json, '1.0');             
                this._settings_version = '1.0';       
                (<any>this._settings) = convert(json, '3.1');
                this.cleanSettings(this._settings);
                return;
            } catch (e) {}
            
            try { 
                validate(json, '2.0');             
                this._settings_version = '2.0';       
                (<any>this._settings) = convert(json, '3.1');
                this.cleanSettings(this._settings);
                return;
            } catch (e) {}

            try { 
                validate(json, '3.0');             
                this._settings_version = '3.0';       
                (<any>this._settings) = convert(json, '3.1');
                this.cleanSettings(this._settings);
                return;
            } catch (e) {}

            try { 
                validate(json, '3.1');             
                this._settings_version = '3.1';       
                (<any>this._settings) = convert(json, '3.1');
                this.cleanSettings(this._settings);
                return;
            } catch (e) {
                const error = new ShapeDiverViewerSettingsError('SettingsEngine.loadSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
                throw this._logger.handleError(LOGGING_TOPIC.SETTINGS, `SettingsEngine.loadSettings`, error);
            }
        } else {
            this._settings_version = '3.1';       
            (<any>this._settings) = DefaultsV3_1();
            return;
        }
    }

    public reset() {
        this._settings_version = '3.1';       
        (<any>this._settings) = DefaultsV3_1();
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private cleanSettings(json: ISettingsV3_1) {
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