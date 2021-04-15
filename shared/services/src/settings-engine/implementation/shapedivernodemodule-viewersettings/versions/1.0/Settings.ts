import { ISettings } from "../../interfaces/interfaces";
import { SettingsVersion } from "../../SettingsVersion";
import { Setting } from "../../Setting";
import { ISettingsObject } from "./interfaces";
import { BaseSettings } from "../../BaseSettings";

export class Settings extends BaseSettings {
    // #region Properties (1)

    protected _settings: ISettingsObject;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * 
     * @param settingsObject a settings object that is a JSON representation of this SettingsObject
     */
    constructor(settingsJSON?: any) {
        super();
        this._version = new SettingsVersion('1.0');
        this._settings = {
            build_date: new Setting('', 'string', '', false),
            build_version: new Setting('', 'string', '', false),
            settings_version: new Setting('1.0', 'string', '', true),
    
            ambientOcclusion: new Setting(true, (v:any) => true),
            autoRotateSpeed: new Setting(0.0, (v:any) => true),
            backgroundColor: new Setting('0xffffffff', (v:any) => true),
            bumpAmplitude: new Setting(1.0, (v:any) => true),
            camera: new Setting({
                position: new Setting({ x: 0, y: 0, z: 0 }, (v:any) => true),
                target: new Setting({ x: 0, y: 0, z: 0 }, (v:any) => true),
            }, (v:any) => true),
            cameraAutoAdjust: new Setting(false, (v:any) => true),
            cameraMovementDuration: new Setting(0, (v:any) => true),
            cameraOrtho: new Setting({
                position: new Setting({ x: 0, y: 0, z: 0 }, (v:any) => true),
                target: new Setting({ x: 0, y: 0, z: 0 }, (v:any) => true),
            }, (v:any) => true),
            cameraRevertAtMouseUp: new Setting(false, (v:any) => true),
            clearAlpha: new Setting(1.0, (v:any) => true),
            clearColor: new Setting('#ffffff', (v:any) => true),
            commitParameters: new Setting(false, (v:any) => true),
            controlDamping: new Setting(0.1, (v:any) => true),
            controlNames: new Setting({}, (v:any) => true),
            controlOrder: new Setting([], (v:any) => true),
            defaultMaterialColor: new Setting('#d3d3d3', (v:any) => true),
            disablePan: new Setting(false, (v:any) => true),
            disableZoom: new Setting(false, (v:any) => true),
            enableAutoRotation: new Setting(false, (v:any) => true),
            enableRotation: new Setting(true, (v:any) => true),
            environmentMap: new Setting('none', (v:any) => true),
            environmentMapResolution: new Setting('1024', (v:any) => true),
            fov: new Setting(45, (v:any) => true),
            lightScene: new Setting('default', (v:any) => true),
            lightScenes: new Setting(null, (v:any) => true),
            panSpeed: new Setting(0.5, (v:any) => true),
            parametersHidden: new Setting([], (v:any) => true),
            pointSize: new Setting(1.0, (v:any) => true),
            revertAtMouseUpDuration: new Setting(800, (v:any) => true),
            rotateSpeed: new Setting(0.25, (v:any) => true),
            showEnvironmentMap: new Setting(false, (v:any) => true),
            showGrid: new Setting(false, (v:any) => true),
            showGroundPlane: new Setting(false, (v:any) => true),
            showShadows: new Setting(true, (v:any) => true),
            topView: new Setting(false, (v:any) => true),
            zoomExtentFactor: new Setting(1.0, (v:any) => true),
            zoomSpeed: new Setting(1.0, (v:any) => true),
        };

        if(settingsJSON) {
            if((!settingsJSON.clearAlpha || !settingsJSON.clearColor) && settingsJSON.backgroundColor && typeof settingsJSON.backgroundColor === 'string') {
                settingsJSON.clearColor = settingsJSON.backgroundColor.substring(0, 8);
                settingsJSON.clearAlpha = parseInt(settingsJSON.backgroundColor.substring(8), 16) / 255;
            }
            if(settingsJSON.defaultMaterialColor && Array.isArray(settingsJSON.defaultMaterialColor)) {
                let temp = '#';
                for(let i = 0; i < settingsJSON.defaultMaterialColor.length; i++)
                    temp += Number(settingsJSON.defaultMaterialColor[i]).toString(16);
                settingsJSON.defaultMaterialColor = temp;
            }
            if(settingsJSON.topView && settingsJSON.camera && !settingsJSON.cameraOrtho) {
                settingsJSON.cameraOrtho = settingsJSON.camera;
            }

            this._fromJSON(settingsJSON, this._settings);
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public convertFromPreviousVersion(oldSettings: ISettings): Settings {
        return this;
    }

    public convertToPreviousVersion(): Settings {
        return this;
    }

    // #endregion Public Methods (2)
};
