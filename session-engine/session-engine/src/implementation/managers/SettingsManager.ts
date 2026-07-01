import {
	ModelApi,
	ReqConfigure,
	ResBase,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	convert,
	ISettings,
	latestVersion,
	validate,
	type versions} from "@shapediver/viewer.settings";
import {
	Logger,
	SettingsEngine,
	ShapeDiverViewerSessionError,
	ShapeDiverViewerSettingsError} from "@shapediver/viewer.shared.services";
import {type ISettingsSections} from "@shapediver/viewer.shared.types";

import {FileParameter} from "../dto/FileParameter";
import {SessionEngineCore} from "../SessionEngineCore";

/**
 * Manager responsible for settings.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `settingsManager` property.
 */
export class SettingsManager {
	private readonly _logger: Logger = Logger.instance;
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _settingsEngine: SettingsEngine = new SettingsEngine();

	private _viewerSettings?: object;
	private _viewerSettingsVersion: string = latestVersion;
	private _viewerSettingsVersionBackend: string = latestVersion;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get hasStoredSettings(): boolean {
		return this._settingsEngine.hasStoredSettings;
	}

	public get settingsEngine(): SettingsEngine {
		return this._settingsEngine;
	}

	public get viewerSettings(): object | undefined {
		return this._viewerSettings;
	}

	public set viewerSettings(value: object | undefined) {
		this._viewerSettings = value;
	}

	public set viewerSettingsVersionBackend(value: string) {
		this._viewerSettingsVersionBackend = value;
	}

	/**
	 * Apply settings from the response to the session engine.
	 */
	public applySettings(response: ResBase, sections?: ISettingsSections) {
		sections = sections || {};
		if (sections.session === undefined) {
			sections.session = {
				parameter: {displayname: false, order: false, hidden: false},
				export: {displayname: false, order: false, hidden: false},
			};
		}
		if (sections.session.parameter === undefined)
			sections.session.parameter = {
				displayname: false,
				order: false,
				hidden: false,
				value: false,
			};
		if (sections.session.export === undefined)
			sections.session.export = {
				displayname: false,
				order: false,
				hidden: false,
			};
		if (sections.viewport === undefined)
			sections.viewport = {
				ar: false,
				scene: false,
				camera: false,
				light: false,
				environment: false,
				general: false,
				postprocessing: false,
			};

		let config: object;
		if ((<ResBase>response).viewer !== undefined) {
			config = (<ResBase>response).viewer!.config;
		} else {
			throw new ShapeDiverViewerSettingsError(
				"Session.applySettings: No config object available.",
			);
		}

		try {
			validate(config);
		} catch (e) {
			throw new ShapeDiverViewerSettingsError(
				"Session.applySettings: Was not able to validate config object.",
			);
		}

		const settings = <ISettings>convert(config, latestVersion);

		const exportMappingUid: {[key: string]: string | undefined} = {};
		if (
			sections.session.export.displayname ||
			sections.session.export.order ||
			sections.session.export.hidden
		)
			if (response.exports)
				for (const exportId in response.exports)
					if (response.exports[exportId].uid !== undefined)
						exportMappingUid[response.exports[exportId].uid!] =
							exportId;

		const currentSettings = this._settingsEngine.settings;

		// apply parameter settings
		if (
			sections.session.parameter.displayname ||
			sections.session.parameter.order ||
			sections.session.parameter.hidden ||
			sections.session.parameter.value
		) {
			for (const p in this._sessionEngineCore.parameterManager
				.parameters) {
				if (settings.session[p]) {
					if (sections.session.parameter.displayname)
						this._sessionEngineCore.parameterManager.parameters[
							p
						].displayname = settings.session[p].displayname;
					if (sections.session.parameter.order)
						this._sessionEngineCore.parameterManager.parameters[
							p
						].order = settings.session[p].order;
					if (sections.session.parameter.hidden)
						this._sessionEngineCore.parameterManager.parameters[
							p
						].hidden = settings.session[p].hidden || false;
				}

				if (
					response.parameters &&
					response.parameters[p] &&
					!(
						this._sessionEngineCore.parameterManager.parameters[
							p
						] instanceof FileParameter ||
						this._sessionEngineCore.parameterManager.parameters[
							p
						].type.startsWith("s")
					)
				) {
					if (sections.session.parameter.value)
						this._sessionEngineCore.parameterManager.parameters[
							p
						].value =
							response.parameters[p].defval !== undefined
								? response.parameters[p].defval
								: this._sessionEngineCore.parameterManager
										.parameters[p].value;
				}
			}
		}

		// apply export settings
		if (
			sections.session.export.displayname ||
			sections.session.export.order ||
			sections.session.export.hidden
		) {
			for (const p in this._sessionEngineCore.exportManager.exports) {
				let idForSettings = "";
				if (settings.session[p]) {
					idForSettings = p;
				} else {
					const uid =
						this._sessionEngineCore.exportManager.exports[p].uid;
					if (!uid) continue;
					if (!exportMappingUid[uid]) continue;
					idForSettings = exportMappingUid[uid]!;
				}
				if (settings.session[idForSettings]) {
					if (sections.session.export.displayname)
						this._sessionEngineCore.exportManager.exports[
							p
						].displayname =
							settings.session[idForSettings].displayname;
					if (sections.session.export.order)
						this._sessionEngineCore.exportManager.exports[p].order =
							settings.session[idForSettings].order;
					if (sections.session.export.hidden)
						this._sessionEngineCore.exportManager.exports[
							p
						].hidden =
							settings.session[idForSettings].hidden || false;
				}
			}
		}

		// apply ar settings
		if (sections.viewport.ar) {
			currentSettings.ar = settings.ar;
			currentSettings.general.transformation =
				settings.general.transformation;
		}

		// apply camera settings
		if (sections.viewport.camera) currentSettings.camera = settings.camera;

		// apply light settings
		if (sections.viewport.light) currentSettings.light = settings.light;

		// apply scene settings
		if (sections.viewport.scene) {
			currentSettings.environmentGeometry.gridColor =
				settings.environmentGeometry.gridColor;
			currentSettings.environmentGeometry.gridVisibility =
				settings.environmentGeometry.gridVisibility;
			currentSettings.environmentGeometry.groundPlaneColor =
				settings.environmentGeometry.groundPlaneColor;
			currentSettings.environmentGeometry.groundPlaneVisibility =
				settings.environmentGeometry.groundPlaneVisibility;
			currentSettings.environmentGeometry.groundPlaneShadowColor =
				settings.environmentGeometry.groundPlaneShadowColor;
			currentSettings.environmentGeometry.groundPlaneShadowVisibility =
				settings.environmentGeometry.groundPlaneShadowVisibility;
			currentSettings.environmentGeometry.contactShadowVisibility =
				settings.environmentGeometry.contactShadowVisibility;
			currentSettings.environmentGeometry.contactShadowHeight =
				settings.environmentGeometry.contactShadowHeight;
			currentSettings.environmentGeometry.contactShadowBlur =
				settings.environmentGeometry.contactShadowBlur;
			currentSettings.environmentGeometry.contactShadowOpacity =
				settings.environmentGeometry.contactShadowOpacity;
			currentSettings.environmentGeometry.contactShadowDarkness =
				settings.environmentGeometry.contactShadowDarkness;

			currentSettings.rendering.shadows = settings.rendering.shadows;
			currentSettings.rendering.softShadows =
				settings.rendering.softShadows;

			currentSettings.rendering.automaticColorAdjustment =
				settings.rendering.automaticColorAdjustment;
			currentSettings.rendering.textureEncoding =
				settings.rendering.textureEncoding;
			currentSettings.rendering.outputEncoding =
				settings.rendering.outputEncoding;
			currentSettings.rendering.physicallyCorrectLights =
				settings.rendering.physicallyCorrectLights;
			currentSettings.rendering.toneMapping =
				settings.rendering.toneMapping;
			currentSettings.rendering.toneMappingExposure =
				settings.rendering.toneMappingExposure;
		}

		if (sections.viewport.general) {
			currentSettings.configuration = settings.configuration;
			currentSettings.general.pointSize = settings.general.pointSize;
			currentSettings.material.defaultMaterialColor =
				settings.material.defaultMaterialColor;
			currentSettings.material.materialOverrideType =
				settings.material.materialOverrideType;
		}

		// apply postprocessing settings
		if (sections.viewport.postprocessing)
			currentSettings.postprocessing = settings.postprocessing;

		// apply environment settings
		if (sections.viewport.environment) {
			currentSettings.environment.clearAlpha =
				settings.environment.clearAlpha;
			currentSettings.environment.clearColor =
				settings.environment.clearColor;
			currentSettings.environment.map = settings.environment.map;
			currentSettings.environment.mapAsBackground =
				settings.environment.mapAsBackground;
			currentSettings.environment.rotation =
				settings.environment.rotation;
			currentSettings.environment.blurriness =
				settings.environment.blurriness;
			currentSettings.environment.intensity =
				settings.environment.intensity;
		}
	}

	/**
	 * Reset settings to the default values from the model.
	 *
	 * @param sections Sections to reset
	 */
	public resetSettings(sections?: ISettingsSections): void {
		if (!this._sessionEngineCore.responseDto)
			throw new ShapeDiverViewerSessionError(
				"Session.resetSettings: responseDto not available.",
			);

		sections = sections || {};
		if (sections.session === undefined) {
			sections.session = {
				parameter: {displayname: true, order: true, hidden: true},
				export: {displayname: true, order: true, hidden: true},
			};
		}
		if (sections.session.parameter === undefined)
			sections.session.parameter = {
				displayname: true,
				order: true,
				hidden: true,
				value: true,
			};
		if (sections.session.export === undefined)
			sections.session.export = {
				displayname: true,
				order: true,
				hidden: true,
			};
		if (sections.viewport === undefined)
			sections.viewport = {
				ar: true,
				scene: true,
				camera: true,
				light: true,
				environment: true,
				general: true,
				postprocessing: true,
			};

		return this.applySettings(
			this._sessionEngineCore.responseDto,
			sections,
		);
	}

	/**
	 * Save the default parameter values
	 */
	public async saveDefaultParameterValues(): Promise<boolean> {
		this._logger.debugLow(
			`Session(${this._sessionEngineCore.id}).saveDefaultParameters: Saving default parameters.`,
		);
		const response = await this.saveDefaultParameters();
		if (response) {
			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).saveDefaultParameters: Saved default parameters.`,
			);
		} else {
			throw new ShapeDiverViewerSessionError(
				`Session(${this._sessionEngineCore.id}).saveDefaultParameters: Could not save default parameters.`,
			);
		}
		return response;
	}

	/**
	 * Save the default parameter values
	 *
	 * @param retry
	 * @returns
	 */
	public async saveDefaultParameters(retry = false): Promise<boolean> {
		this._sessionEngineCore.utilsManager.checkAvailability(
			"defaultparam",
			true,
		);
		try {
			await new ModelApi(
				this._sessionEngineCore.sdkConfig,
			).updateParameterDefaultValues(
				this._sessionEngineCore.modelId!,
				this._sessionEngineCore.parameterManager.parameterValues,
			);
			return true;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.saveDefaultParameters(true);
		}
	}

	/**
	 * Save the parameter properties for displayname, order, tooltip and hidden
	 *
	 * @param parameters
	 * @param retry
	 * @returns
	 */
	public async saveParameterProperties(
		parameters: {
			[key: string]: {
				displayname: string;
				hidden: boolean;
				order: number;
				tooltip: string;
			};
		},
		retry = false,
	): Promise<boolean> {
		this._sessionEngineCore.utilsManager.checkAvailability(
			"parameter-definition",
			true,
		);
		try {
			await new ModelApi(
				this._sessionEngineCore.sdkConfig,
			).updateParameterDefinitions(
				this._sessionEngineCore.modelId!,
				parameters,
			);
			return true;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.saveParameterProperties(parameters, true);
		}
	}

	/**
	 * Save the viewer settings
	 *
	 * @param json
	 * @param retry
	 * @returns
	 */
	public async saveSettings(json: unknown, retry = false): Promise<boolean> {
		this._sessionEngineCore.utilsManager.checkAvailability(
			"configure",
			true,
		);

		try {
			validate(json, <versions>this._viewerSettingsVersion);

			// if viewer settings version is higher than backend settings version
			// convert to backend settings version
			if (
				+this._viewerSettingsVersion >
				+this._viewerSettingsVersionBackend
			)
				json = convert(
					json,
					<versions>this._viewerSettingsVersionBackend,
				);
		} catch (e) {
			throw new ShapeDiverViewerSettingsError(
				"Session.saveSettings: Settings could not be validated. " +
					(<Error>e).message,
				<Error>e,
			);
		}

		try {
			await new ModelApi(
				this._sessionEngineCore.sdkConfig,
			).updateModelConfig(
				this._sessionEngineCore.modelId!,
				json as ReqConfigure,
			);
			return true;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.saveSettings(json, true);
		}
	}

	/**
	 * Save UI related properties for parameters, exports and outputs
	 *
	 * @param saveInSettings Whether to save the properties in the settings as well
	 * @returns
	 */
	public async saveUiProperties(
		saveInSettings: boolean = true,
	): Promise<boolean> {
		this._logger.debugLow(
			`Session(${this._sessionEngineCore.id}).saveSessionProperties: Saving session properties.`,
		);

		// settings saving
		this.saveSessionSettings();

		let properties: {
			[key: string]: {
				displayname: string;
				hidden: boolean;
				order: number;
				tooltip: string;
			};
		} = {};
		for (const p in this._sessionEngineCore.parameterManager.parameters) {
			properties[p] = {
				displayname:
					this._sessionEngineCore.parameterManager.parameters[p]
						.displayname !== undefined
						? this._sessionEngineCore.parameterManager.parameters[p]
								.displayname!
						: "",
				hidden:
					this._sessionEngineCore.parameterManager.parameters[p]
						.hidden !== undefined
						? this._sessionEngineCore.parameterManager.parameters[p]
								.hidden
						: false,
				order:
					this._sessionEngineCore.parameterManager.parameters[p]
						.order !== undefined
						? this._sessionEngineCore.parameterManager.parameters[p]
								.order!
						: 0,
				tooltip:
					this._sessionEngineCore.parameterManager.parameters[p]
						.tooltip !== undefined
						? this._sessionEngineCore.parameterManager.parameters[p]
								.tooltip!
						: "",
			};
		}
		const responseP =
			Object.values(properties).length !== 0
				? await this.saveParameterProperties(properties)
				: true;

		properties = {};
		for (const e in this._sessionEngineCore.exportManager.exports) {
			properties[e] = {
				displayname:
					this._sessionEngineCore.exportManager.exports[e]
						.displayname !== undefined
						? this._sessionEngineCore.exportManager.exports[e]
								.displayname!
						: "",
				hidden:
					this._sessionEngineCore.exportManager.exports[e].hidden !==
					undefined
						? this._sessionEngineCore.exportManager.exports[e]
								.hidden
						: false,
				order:
					this._sessionEngineCore.exportManager.exports[e].order !==
					undefined
						? this._sessionEngineCore.exportManager.exports[e]
								.order!
						: 0,
				tooltip:
					this._sessionEngineCore.exportManager.exports[e].tooltip !==
					undefined
						? this._sessionEngineCore.exportManager.exports[e]
								.tooltip!
						: "",
			};
		}
		const responseE =
			Object.values(properties).length !== 0
				? await this._sessionEngineCore.exportManager.saveExportProperties(
						properties,
					)
				: true;

		properties = {};
		for (const o in this._sessionEngineCore.outputManager.outputs) {
			properties[o] = {
				displayname:
					this._sessionEngineCore.outputManager.outputs[o]
						.displayname !== undefined
						? this._sessionEngineCore.outputManager.outputs[o]
								.displayname!
						: "",
				hidden:
					this._sessionEngineCore.outputManager.outputs[o].hidden !==
					undefined
						? this._sessionEngineCore.outputManager.outputs[o]
								.hidden
						: false,
				order:
					this._sessionEngineCore.outputManager.outputs[o].order !==
					undefined
						? this._sessionEngineCore.outputManager.outputs[o]
								.order!
						: 0,
				tooltip:
					this._sessionEngineCore.outputManager.outputs[o].tooltip !==
					undefined
						? this._sessionEngineCore.outputManager.outputs[o]
								.tooltip!
						: "",
			};
		}
		const responseO =
			Object.values(properties).length !== 0
				? await this._sessionEngineCore.outputManager.saveOutputProperties(
						properties,
					)
				: true;

		// save partial settings
		const response = saveInSettings
			? await this.saveSettings(this._settingsEngine.settings)
			: true;

		if (response && responseP && responseO && responseE) {
			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).saveSessionProperties: Saved session properties.`,
			);
		} else {
			this._logger.warn(
				`Session(${this._sessionEngineCore.id}).saveSessionProperties: Could not save session properties.`,
			);
		}
		return response && responseP && responseO && responseE;
	}

	/**
	 * Save the session settings for parameters and exports
	 */
	private saveSessionSettings() {
		const parameters = this._sessionEngineCore.parameterManager.parameters;
		const exports = this._sessionEngineCore.exportManager.exports;

		const sessionProperties: {
			[key: string]: {
				order: number;
				displayname: string;
				hidden: boolean;
			};
		} = {};
		for (const p in parameters) {
			sessionProperties[p] = {
				order: parameters[p].order || 0,
				displayname: parameters[p].displayname || "",
				hidden: parameters[p].hidden,
			};
		}
		for (const e in exports) {
			sessionProperties[e] = {
				order: exports[e].order || 0,
				displayname: exports[e].displayname || "",
				hidden: exports[e].hidden,
			};
		}
		this._settingsEngine.session = sessionProperties;
	}
}
