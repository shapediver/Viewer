import {
    convert,
    Defaults,
    ISettings,
    latestVersion,
    validate,
    versions
} from '@shapediver/viewer.settings';
import { EventEngine } from '../event-engine/EventEngine';
import { Logger } from '../logger/Logger';
import { ShapeDiverViewerSettingsError } from '../logger/ShapeDiverViewerErrors';

// #region Type aliases (8)

type IARSettings = ISettings['ar'];
type ICameraSettings = ISettings['camera'];
type IEnvironmentGeometrySettings = ISettings['environmentGeometry'];
type IEnvironmentSettings = ISettings['environment'];
type IGeneralSettings = ISettings['general'];
type ILightSettings = ISettings['light'];
type IRenderingSettings = ISettings['rendering'];
type ISessionSettings = ISettings['session'];

// #endregion Type aliases (8)

// #region Classes (1)

export class SettingsEngine {
    // #region Properties (4)

    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _logger: Logger = Logger.instance;
    private readonly _settings: ISettings = Defaults();

    private _settingsJson: any;

    // #endregion Properties (4)

    // #region Public Getters And Setters (11)

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

    // #endregion Public Getters And Setters (11)

    // #region Public Methods (3)

    public flatten() {
        const flattenObject = (ob: any) => {
            const toReturn: { [key: string]: any } = {};
            for (const i in ob) {
                if (!ob.hasOwnProperty(i)) continue;
                if ((typeof ob[i]) == 'object') {
                    const flatObject = flattenObject(ob[i]);
                    for (const x in flatObject) {
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
            const prevVersions = ['1.0', '2.0', '3.0', '3.1', '3.2', '3.3', '3.4', '4.0', '4.1'];
            for (let i = 0; i < prevVersions.length; i++) {
                const v = prevVersions[i];

                try {
                    validate(json, v as versions);
                    (<any>this._settings) = convert(json, latestVersion);
                    this.cleanSettings(this._settings);
                    return;
                } catch (e) { }
            }

            try {
                validate(json, latestVersion);
                (<any>this._settings) = convert(json, latestVersion);
                this.cleanSettings(this._settings);
                return;
            } catch (e) {
                throw new ShapeDiverViewerSettingsError('SettingsEngine.loadSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
            }
        } else {
            (<any>this._settings) = Defaults();
            return;
        }
    }

    public reset() {
        (<any>this._settings) = Defaults();
    }

    // #endregion Public Methods (3)

    // #region Private Methods (1)

    private cleanSettings(json: ISettings) {
        for (const c in json.camera.cameras) {
            const camera = json.camera.cameras[c];
            if (camera.type === 'perspective') {
                const restrictions = (<any>camera.controls).restrictions;
                if (restrictions.position.cube.min.x === null) restrictions.position.cube.min.x = -Infinity;
                if (restrictions.position.cube.min.y === null) restrictions.position.cube.min.y = -Infinity;
                if (restrictions.position.cube.min.z === null) restrictions.position.cube.min.z = -Infinity;
                if (restrictions.position.cube.max.x === null) restrictions.position.cube.max.x = Infinity;
                if (restrictions.position.cube.max.y === null) restrictions.position.cube.max.y = Infinity;
                if (restrictions.position.cube.max.z === null) restrictions.position.cube.max.z = Infinity;
                if (restrictions.position.sphere.radius === null) restrictions.position.sphere.radius = Infinity;
                if (restrictions.target.cube.min.x === null) restrictions.target.cube.min.x = -Infinity;
                if (restrictions.target.cube.min.y === null) restrictions.target.cube.min.y = -Infinity;
                if (restrictions.target.cube.min.z === null) restrictions.target.cube.min.z = -Infinity;
                if (restrictions.target.cube.max.x === null) restrictions.target.cube.max.x = Infinity;
                if (restrictions.target.cube.max.y === null) restrictions.target.cube.max.y = Infinity;
                if (restrictions.target.cube.max.z === null) restrictions.target.cube.max.z = Infinity;
                if (restrictions.target.sphere.radius === null) restrictions.target.sphere.radius = Infinity;
                if (restrictions.rotation.minAzimuthAngle === null) restrictions.rotation.minAzimuthAngle = -Infinity;
                if (restrictions.rotation.maxAzimuthAngle === null) restrictions.rotation.maxAzimuthAngle = Infinity;
                if (restrictions.zoom.maxDistance === null) restrictions.zoom.maxDistance = Infinity;
            }
        }
    }

    // #endregion Private Methods (1)
}

// #endregion Classes (1)

// #region Enums (1)

/**
 * Session settings to be used by a viewport.
 * 
 * The {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} 
 * allows to persist settings of the viewer, individually for each model that it hosts. Persisting the settings
 * of the viewer requires permissions which are typically only granted to the owner of the model. Editing
 * of the settings typically happens on the model edit page of the ShapeDiver Platform.
 * 
 * Whenever an instance of the viewer creates a session with a model, the settings are made available to the viewer.
 * It is possible to use multiple sessions with different models from a single instance of the viewer. 
 * Therefore the viewer offers a choice on which settings to use.
 */
export enum SESSION_SETTINGS_MODE {
    /** No settings of a session will be used for the viewport. */
    NONE = 'none',
    /** 
     * The settings of the very first session created will be used for the viewport. 
     */
    FIRST = 'first',
    /** 
     * Use this mode in case you want to assign a specific session identifier 
     * to the viewport, whose settings will be used.
     */
    MANUAL = 'manual',
}

// #endregion Enums (1)
