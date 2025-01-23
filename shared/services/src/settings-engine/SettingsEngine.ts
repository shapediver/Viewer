import {
    convert,
    ISettings,
    latestVersion,
    previousVersion,
    validate
} from '@shapediver/viewer.settings';
import { ShapeDiverViewerSettingsError } from '../logger/ShapeDiverViewerErrors';
import { Defaults } from './defaults/Defaults';

// #region Type aliases (8)

type IARSettings = ISettings['ar'];
type ICameraSettings = ISettings['camera'];
type IEnvironmentGeometrySettings = ISettings['environmentGeometry'];
type IEnvironmentSettings = ISettings['environment'];
type IGeneralSettings = ISettings['general'];
type ILightSettings = ISettings['light'];
type IMaterialSettings = ISettings['material'];
type IRenderingSettings = ISettings['rendering'];
type ISessionSettings = ISettings['session'];

// #endregion Type aliases (8)

// #region Classes (1)

export class SettingsEngine {
    // #region Properties (4)

    private _settings: ISettings = Defaults();
    private _settingsJson: unknown;

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

    public get material(): IMaterialSettings {
        return this._settings.material;
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

    public get settingsJson(): unknown {
        return this._settingsJson;
    }

    // #endregion Public Getters And Setters (11)

    // #region Public Methods (2)

    public loadSettings(json: unknown) {
        this._settingsJson = json;
        if (JSON.stringify(json) !== JSON.stringify({})) {
            for (let i = 0; i < previousVersion.length; i++) {
                const v = previousVersion[i];

                try {
                    validate(json, v);
                    this._settings = convert(json, latestVersion) as ISettings;
                    this.cleanSettings(this._settings);
                    return;
                } catch (e) {
                    // it's ok, we just try the next version
                    // only the latest version is expected to be valid
                }
            }

            try {
                validate(json, latestVersion);
                this._settings = convert(json, latestVersion) as ISettings;
                this.cleanSettings(this._settings);
                return;
            } catch (e) {
                throw new ShapeDiverViewerSettingsError('SettingsEngine.loadSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
            }
        } else {
            this._settings = Defaults();
            return;
        }
    }

    public reset() {
        this._settings = Defaults();
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    private cleanSettings(json: ISettings) {
        for (const c in json.camera.cameras) {
            const camera = json.camera.cameras[c];
            if (camera.type === 'perspective') {
                const restrictions = camera.controls.restrictions;
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
