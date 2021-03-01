import { container, singleton } from 'tsyringe';
import { EventEngine, EVENTTYPE } from '../../index';
import { DefaultSettings } from './DefaultSettings';

type GeneralSettings = typeof DefaultSettings.viewer;
type SceneSettings = typeof DefaultSettings.viewer.scene;
type CameraSettings = typeof DefaultSettings.viewer.scene.camera;
type CameraOrbitControlsSettings = typeof DefaultSettings.viewer.scene.camera.controls.orbit;
type CameraOrthographicControlsSettings = typeof DefaultSettings.viewer.scene.camera.controls.orthographic;
type LightSettings = typeof DefaultSettings.viewer.scene.lights;
type MaterialSettings = typeof DefaultSettings.viewer.scene.material;
type RenderingSettings = typeof DefaultSettings.viewer.scene.render;

@singleton()
export class SettingsEngine {
    // #region Properties (1)

    private readonly _settings = DefaultSettings;
    private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);

    // #endregion Properties (1)

    // #region Public Accessors (8)

    /**
     * Getter camera
     * @return {CameraSettings}
     */
    public get camera(): CameraSettings {
		return this._settings.viewer.scene.camera;
	}

    /**
     * Getter cameraOrbitControls
     * @return {CameraOrbitControlsSettings}
     */
    public get cameraOrbitControls(): CameraOrbitControlsSettings {
		return this._settings.viewer.scene.camera.controls.orbit;
	}

    /**
     * Getter cameraOrthographicControls
     * @return {CameraOrthographicControlsSettings}
     */
    public get cameraOrthographicControls(): CameraOrthographicControlsSettings {
		return this._settings.viewer.scene.camera.controls.orthographic;
	}

    /**
     * Getter general
     * @return {GeneralSettings}
     */
    public get general(): GeneralSettings {
		return this._settings.viewer;
	}

    /**
     * Getter lights
     * @return {LightSettings}
     */
    public get lights(): LightSettings {
		return this._settings.viewer.scene.lights;
	}

    /**
     * Getter material
     * @return {MaterialSettings}
     */
    public get material(): MaterialSettings {
		return this._settings.viewer.scene.material;
	}

    /**
     * Getter rendering
     * @return {RenderingSettings}
     */
    public get rendering(): RenderingSettings {
		return this._settings.viewer.scene.render;
	}

    /**
     * Getter scene
     * @return {SceneSettings}
     */
    public get scene(): SceneSettings {
		return this._settings.viewer.scene;
	}

    private _fromJson(json: any, settings: any) {
        if(!json) return;
        for (let s in settings) {
            if (settings[s].isSetting === true) {
                if(json[s] !== undefined) settings[s].value = json[s];
            } else {
                this._fromJson(json[s], settings[s])
            }
        }
    }

    public fromJson(json: any) {
        this._fromJson(json, this._settings);
        this._eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, {});
    }

    // #endregion Public Accessors (8)
}