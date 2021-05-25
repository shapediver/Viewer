import { container, singleton } from 'tsyringe';
import { EventEngine } from '../../event-engine/EventEngine';
import { EVENTTYPE } from '../../event-engine/EventTypes';
import { StateEngine } from '../../state-engine/StateEngine';
import { ISetting } from '../interfaces/ISetting';
import { DefaultSettings } from './DefaultSettings';
import { Settings_2_0 } from './shapedivernodemodule-viewersettings/main';
import { SettingsConversion } from './shapedivernodemodule-viewersettings/SettingsConversion';
import { AbstractSetting } from './types/AbstractSetting';
import { CustomSetting } from './types/CustomSetting';
import { Vec3Setting } from './types/Vec3Setting';

type GeneralSettings = typeof DefaultSettings;
type SceneSettings = typeof DefaultSettings.viewer.scene;
type CameraSettings = typeof DefaultSettings.viewer.scene.camera;
type CameraOrbitControlsSettings = typeof DefaultSettings.viewer.scene.camera.controls.orbit;
type CameraOrthographicControlsSettings = typeof DefaultSettings.viewer.scene.camera.controls.orthographic;
type LightSettings = typeof DefaultSettings.viewer.scene.lights;
type MaterialSettings = typeof DefaultSettings.viewer.scene.material;
type RenderingSettings = typeof DefaultSettings.viewer.scene.render;

type SettingsObject = { [key: string]: ISetting<any> | SettingsObject };

@singleton()
export class SettingsEngine {
    // #region Properties (1)

    private readonly _defaultSettings = DefaultSettings;
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _sessionSettings = ['commitParameters', 'commitSettings', 'controlNames', 'controlOrder', 'parametersHidden'];

    // #endregion Properties (1)

    // #region Public Accessors (8)

    /**
     * Getter camera
     * @return {CameraSettings}
     */
    public get camera(): CameraSettings {
		return this._defaultSettings.viewer.scene.camera;
	}

    /**
     * Getter cameraOrbitControls
     * @return {CameraOrbitControlsSettings}
     */
    public get cameraOrbitControls(): CameraOrbitControlsSettings {
		return this._defaultSettings.viewer.scene.camera.controls.orbit;
	}

    /**
     * Getter cameraOrthographicControls
     * @return {CameraOrthographicControlsSettings}
     */
    public get cameraOrthographicControls(): CameraOrthographicControlsSettings {
		return this._defaultSettings.viewer.scene.camera.controls.orthographic;
	}

    /**
     * Getter general
     * @return {GeneralSettings}
     */
    public get general(): GeneralSettings {
		return this._defaultSettings;
	}

    /**
     * Getter lights
     * @return {LightSettings}
     */
    public get lights(): LightSettings {
		return this._defaultSettings.viewer.scene.lights;
	}

    /**
     * Getter material
     * @return {MaterialSettings}
     */
    public get material(): MaterialSettings {
		return this._defaultSettings.viewer.scene.material;
	}

    /**
     * Getter rendering
     * @return {RenderingSettings}
     */
    public get rendering(): RenderingSettings {
		return this._defaultSettings.viewer.scene.render;
	}

    /**
     * Getter scene
     * @return {SceneSettings}
     */
    public get scene(): SceneSettings {
		return this._defaultSettings.viewer.scene;
	}

    private _fromJson(json: any, settings: any, sessionSettings: boolean = false) {
        if(!json) return;
        for (let s in settings) {
            if (settings[s].isSetting === true) {
                if(json[s] !== undefined && !(sessionSettings && !this._sessionSettings.includes(s))) settings[s].value = json[s];
            } else {
                this._fromJson(json[s], settings[s])
            }
        }
    }

    public fromJson(json: any, sessionId: string, loadAsPrimary: boolean = false) {
        const objJSON = json ? new SettingsConversion().convert(json, '2.0') : json;
        this._fromJson(objJSON, this._defaultSettings, loadAsPrimary);
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { sessionId, loadAsPrimary });
    }
    
    private _toJson(settings: SettingsObject, json: any) {
        for (let s in settings) {
            if(settings[s] instanceof AbstractSetting) {
                if(settings[s] instanceof Vec3Setting) {
                    json[s] = { x: settings[s].value[0] || 0, y: settings[s].value[1] || 0, z: settings[s].value[2] || 0 };
                } else if (settings[s] instanceof CustomSetting) {
                    json[s] = settings[s].value;
                } else {
                    json[s] = settings[s].value;
                }

            } else {
                if(!json[s]) json[s] = {};
                this._toJson(<SettingsObject>settings[s], json[s])
            }
        }
    }

    public toJson(): any {
        const json = {};
        this._toJson(this._defaultSettings, json);
        return new SettingsConversion().convert(json, '2.0');
    }

    private _reset(settings: any) {
        for (let s in settings) {
            if(settings[s] instanceof AbstractSetting) {
                settings[s].value = settings[s].default;
            } else {
                this._reset(settings[s]);
            }
        }
    }

    public reset() {
        this._reset(this._defaultSettings);
        const objJSON = new SettingsConversion().convert(new Settings_2_0().toJSON(), '2.0');
        this._fromJson(objJSON, this._defaultSettings, true);
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { loadAsPrimary: true });
    }

    private _deconstruct(settings: any, deconstructed: any, parentName: string) {
        for (let s in settings) {
            if (settings[s].isSetting === true) {
                // @ts-ignore
                deconstructed[parentName ? parentName + '.' + s : '' + s] = settings[s].value;
            } else {
                this._deconstruct(settings[s], deconstructed, parentName ? parentName + '.' + s : '' + s)
            }
        }
    }

    public deconstruct(): any {
        let deconstructed = {};
        this._deconstruct(this.general, deconstructed, '');
        return deconstructed;
    }

    // #endregion Public Accessors (8)
}