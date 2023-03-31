import { convert, validate, DefaultsV3_3 as Defaults, ISettingsV3_3 as ISettings, versions, latestVersion } from '@shapediver/viewer.settings';

import { EventEngine } from '../event-engine/EventEngine'
import { Logger } from '../logger/Logger';
import { ShapeDiverViewerSettingsError } from '../logger/ShapeDiverViewerErrors';

type IARSettings = ISettings["ar"];
type ICameraSettings = ISettings["camera"];
type IEnvironmentSettings = ISettings["environment"];
type IEnvironmentGeometrySettings = ISettings["environmentGeometry"];
type IGeneralSettings = ISettings["general"];
type ILightSettings = ISettings["light"];
type IRenderingSettings = ISettings["rendering"];
type ISessionSettings = ISettings["session"];

export class SettingsEngine {
    // #region Properties (8)

    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _logger: Logger = Logger.instance;
    private readonly _settings: ISettings = Defaults();
    private _settingsJson: any;
    private _settings_version: versions = latestVersion;

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

    public get settings(): ISettings {
        return this._settings;
    }
    
    public get settingsJson(): any {
        return this._settingsJson;
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
        this._settingsJson = json;
        if (JSON.stringify(json) !== JSON.stringify({})) {

            const prevVersions = ['1.0', '2.0', '3.0', '3.1', '3.2'];
            for(let i = 0; i < prevVersions.length; i++) {
                const v = prevVersions[i];

                try { 
                    validate(json, v as versions);             
                    this._settings_version = v as versions;       
                    (<any>this._settings) = convert(json, latestVersion);
                    this.cleanSettings(this._settings);
                    return;
                } catch (e) {}
            }

            try { 
                validate(json, latestVersion);             
                this._settings_version = latestVersion;       
                (<any>this._settings) = convert(json, latestVersion);
                this.cleanSettings(this._settings);
                return;
            } catch (e) {
                throw new ShapeDiverViewerSettingsError('SettingsEngine.loadSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
            }
        } else {
            this._settings_version = latestVersion;       
            (<any>this._settings) = Defaults();
            return;
        }
    }

    public reset() {
        this._settings_version = latestVersion;       
        (<any>this._settings) = Defaults();
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private cleanSettings(json: ISettings) {
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