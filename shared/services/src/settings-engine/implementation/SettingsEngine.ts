import { container, singleton } from 'tsyringe';
import { EventEngine } from '../../event-engine/EventEngine';
import { EVENTTYPE } from '../../event-engine/EventTypes';
import { StateEngine } from '../../state-engine/StateEngine';
import { ISetting } from '../interfaces/ISetting';
import { DefaultSettings } from './DefaultSettings';
import { SettingsConversion } from './shapedivernodemodule-viewersettings/SettingsConversion';
import { AbstractSetting } from './types/AbstractSetting';

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

    public fromJson(json: any, sessionId: string) {
        console.log(json)
        const objJSON = json ? new SettingsConversion().convert(json, '2.0') : json;
        this._fromJson(objJSON, this._defaultSettings, this._stateEngine.firstSettingsRegistered.resolved);
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { sessionId });
    }
    private _toJson(settings: SettingsObject, json: any) {
        for (let s in settings) {
            if(settings[s] instanceof AbstractSetting) {
                json[s] = settings[s].value;
            } else {
                if(!json[s]) json[s] = {};
                this._toJson(<SettingsObject>settings[s], json[s])
            }
        }
    }

    public toJson(): any {
        const json = {};
        this._toJson(this._defaultSettings, json);
        const objJSON = new SettingsConversion().convert(json, '2.0');

        console.log(json, objJSON)
    }

    // #endregion Public Accessors (8)
}