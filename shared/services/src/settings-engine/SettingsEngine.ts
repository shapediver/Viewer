import {
	convert,
	ISettings,
	latestVersion,
	previousVersion,
	validate} from "@shapediver/viewer.settings";
import {ShapeDiverViewerSettingsError} from "../logger/ShapeDiverViewerErrors";
import {Defaults} from "./defaults/Defaults";
import {FurnitureDefaults} from "./defaults/FurnitureDefaults";
import {HighPerformanceDefaults} from "./defaults/HighPerformanceDefaults";
import {JewelryDefaults} from "./defaults/JewelryDefaults";
import {MedicalDefaults} from "./defaults/MedicalDefaults";
import {TwoDimensionalDefaults} from "./defaults/TwoDimensionalDefaults";

// #region Type aliases (8)

type IARSettings = ISettings["ar"];
type ICameraSettings = ISettings["camera"];
type IConfigurationSettings = ISettings["configuration"];
type IEnvironmentGeometrySettings = ISettings["environmentGeometry"];
type IEnvironmentSettings = ISettings["environment"];
type IGeneralSettings = ISettings["general"];
type ILightSettings = ISettings["light"];
type IMaterialSettings = ISettings["material"];
type IRenderingSettings = ISettings["rendering"];
type ISessionSettings = ISettings["session"];

// #endregion Type aliases (8)

// #region Classes (1)

export class SettingsEngine {
	// #region Properties (4)

	private _hasStoredSettings: boolean = false;
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

	public get configuration(): IConfigurationSettings {
		return this._settings.configuration;
	}

	public set configuration(value: IConfigurationSettings) {
		this._settings.configuration = value;
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

	public get hasStoredSettings(): boolean {
		return this._hasStoredSettings;
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
			this._hasStoredSettings = true;
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
				throw new ShapeDiverViewerSettingsError(
					"SettingsEngine.loadSettings: Settings could not be validated. " +
						(<Error>e).message,
					<Error>e,
				);
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
			if (camera.type === "perspective") {
				const restrictions = camera.controls.restrictions;
				if (restrictions.position.cube.min.x === null)
					restrictions.position.cube.min.x = -Infinity;
				if (restrictions.position.cube.min.y === null)
					restrictions.position.cube.min.y = -Infinity;
				if (restrictions.position.cube.min.z === null)
					restrictions.position.cube.min.z = -Infinity;
				if (restrictions.position.cube.max.x === null)
					restrictions.position.cube.max.x = Infinity;
				if (restrictions.position.cube.max.y === null)
					restrictions.position.cube.max.y = Infinity;
				if (restrictions.position.cube.max.z === null)
					restrictions.position.cube.max.z = Infinity;
				if (restrictions.position.sphere.radius === null)
					restrictions.position.sphere.radius = Infinity;
				if (restrictions.target.cube.min.x === null)
					restrictions.target.cube.min.x = -Infinity;
				if (restrictions.target.cube.min.y === null)
					restrictions.target.cube.min.y = -Infinity;
				if (restrictions.target.cube.min.z === null)
					restrictions.target.cube.min.z = -Infinity;
				if (restrictions.target.cube.max.x === null)
					restrictions.target.cube.max.x = Infinity;
				if (restrictions.target.cube.max.y === null)
					restrictions.target.cube.max.y = Infinity;
				if (restrictions.target.cube.max.z === null)
					restrictions.target.cube.max.z = Infinity;
				if (restrictions.target.sphere.radius === null)
					restrictions.target.sphere.radius = Infinity;
				if (restrictions.rotation.minAzimuthAngle === null)
					restrictions.rotation.minAzimuthAngle = -Infinity;
				if (restrictions.rotation.maxAzimuthAngle === null)
					restrictions.rotation.maxAzimuthAngle = Infinity;
				if (restrictions.zoom.maxDistance === null)
					restrictions.zoom.maxDistance = Infinity;
			}
		}
	}

	// #endregion Private Methods (1)
}

// #endregion Classes (1)

// #region Enums (1)

export const defaultSettings = {
	default: Defaults,
	furniture: FurnitureDefaults,
	highPerformance: HighPerformanceDefaults,
	jewelry: JewelryDefaults,
	medical: MedicalDefaults,
	twoDimensional: TwoDimensionalDefaults,
};
// #endregion Enums (1)
