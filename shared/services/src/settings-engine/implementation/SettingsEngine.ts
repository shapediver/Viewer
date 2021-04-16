import { container, singleton } from 'tsyringe';
import { EventEngine } from '../../event-engine/EventEngine';
import { EVENTTYPE } from '../../event-engine/EventTypes';
import { StateEngine } from '../../state-engine/StateEngine';
import { ISetting } from '../interfaces/ISetting';
import { DefaultSettings } from './DefaultSettings';
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

    public fromJson(json: any, sessionId: string) {
        const objJSON = json ? new SettingsConversion().convert(json, '2.0') : json;
        this._fromJson(objJSON, this._defaultSettings, this._stateEngine.firstSettingsRegistered.resolved);
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, { sessionId });
    }
    
    private _toJson(settings: SettingsObject, json: any) {
        for (let s in settings) {
            if(settings[s] instanceof AbstractSetting) {
                if(settings[s] instanceof Vec3Setting) {
                    json[s] = { x: settings[s].value[0] || 0, y: settings[s].value[1] || 0, z: settings[s].value[2] || 0 };
                } else if (settings[s] instanceof CustomSetting) {
                    json[s] = settings[s].value;
                    if(settings[s].value.min) json[s].min = { x: settings[s].value.min[0] || 0, y: settings[s].value.min[1] || 0, z: settings[s].value.min[2] || 0 };
                    if(settings[s].value.max) json[s].max = { x: settings[s].value.max[0] || 0, y: settings[s].value.max[1] || 0, z: settings[s].value.max[2] || 0 };
                    if(settings[s].value.position) json[s].position = { x: settings[s].value.position[0] || 0, y: settings[s].value.position[1] || 0, z: settings[s].value.position[2] || 0 };
                    if(settings[s].value.target) json[s].target = { x: settings[s].value.target[0] || 0, y: settings[s].value.target[1] || 0, z: settings[s].value.target[2] || 0 };
                    if(settings[s].value.center) json[s].center = { x: settings[s].value.center[0] || 0, y: settings[s].value.center[1] || 0, z: settings[s].value.center[2] || 0 };
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

    // #endregion Public Accessors (8)
}